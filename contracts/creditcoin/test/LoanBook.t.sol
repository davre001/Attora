// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {INativeQueryVerifier} from "@gluwa/asc-contracts/contracts/write-ability/common/INativeQueryVerifier.sol";
import {LoanBook} from "../src/LoanBook.sol";
import {MockStable} from "../src/MockStable.sol";
import {MockNativeQueryVerifier} from "./mocks/MockNativeQueryVerifier.sol";

contract LoanBookTest is Test {
    address constant PRECOMPILE = 0x0000000000000000000000000000000000000FD2;
    bytes32 constant COLLATERAL_COMMITTED_TOPIC = keccak256("CollateralCommitted(address,bytes32,bytes32,uint8)");

    uint64 constant SOURCE_CHAIN_KEY = 1;
    address sourceVault = makeAddr("sourceVault");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    LoanBook loanBook;
    MockStable stable;

    function setUp() public {
        stable = new MockStable();
        loanBook = new LoanBook(sourceVault, SOURCE_CHAIN_KEY, stable);
        _setVerifierResult(true);
    }

    function _setVerifierResult(bool result) internal {
        vm.etch(PRECOMPILE, address(new MockNativeQueryVerifier(result)).code);
    }

    /// @dev Mirrors EvmV1Decoder.LogEntryTuple's shape (address, bytes32[], bytes) —
    /// field names don't matter for ABI encoding, only the type sequence does.
    struct LogEntryTuple {
        address addr;
        bytes32[] topics;
        bytes data;
    }

    function _buildEncodedTx(address emitter, address borrower, bytes32 loanId, bytes32 commitment, uint8 tier)
        internal
        pure
        returns (bytes memory)
    {
        return _buildEncodedTxWithTopic(COLLATERAL_COMMITTED_TOPIC, emitter, borrower, loanId, commitment, tier);
    }

    function _buildEncodedTxWithTopic(
        bytes32 topic0,
        address emitter,
        address borrower,
        bytes32 loanId,
        bytes32 commitment,
        uint8 tier
    ) internal pure returns (bytes memory) {
        bytes32[] memory topics = new bytes32[](3);
        topics[0] = topic0;
        topics[1] = bytes32(uint256(uint160(borrower)));
        topics[2] = loanId;

        LogEntryTuple[] memory logs = new LogEntryTuple[](1);
        logs[0] = LogEntryTuple({addr: emitter, topics: topics, data: abi.encode(commitment, tier)});

        bytes[] memory chunks = new bytes[](3);
        chunks[0] = "";
        chunks[1] = "";
        chunks[2] = abi.encode(uint8(1), uint64(21_000), logs, bytes(""));

        return abi.encode(uint8(0), chunks);
    }

    function _openLoanAs(address caller, uint64 blockHeight, bytes32 merkleRoot, bytes memory encodedTx)
        internal
        returns (bool)
    {
        INativeQueryVerifier.MerkleProofEntry[] memory siblings = new INativeQueryVerifier.MerkleProofEntry[](0);
        bytes32[] memory continuityRoots = new bytes32[](0);

        vm.prank(caller);
        return loanBook.openLoan(blockHeight, encodedTx, merkleRoot, siblings, bytes32(0), continuityRoots);
    }

    function test_OpenLoan_Tier2_Succeeds() public {
        bytes32 loanId = keccak256("loan-1");
        bytes memory encodedTx = _buildEncodedTx(sourceVault, alice, loanId, keccak256("commitment-1"), 2);

        vm.expectEmit(true, true, false, true, address(loanBook));
        emit LoanBook.LoanOpened(loanId, alice, 2, 500 ether);

        bool ok = _openLoanAs(alice, 100, keccak256("root-1"), encodedTx);
        assertTrue(ok);

        (address borrower, uint8 tier, uint256 debt, bool open) = loanBook.loans(loanId);
        assertEq(borrower, alice);
        assertEq(tier, 2);
        assertEq(debt, 0);
        assertTrue(open);
    }

    function test_OpenLoan_RevertsOnBorrowerMismatch() public {
        bytes32 loanId = keccak256("loan-2");
        bytes memory encodedTx = _buildEncodedTx(sourceVault, alice, loanId, keccak256("c"), 1);

        vm.expectRevert(LoanBook.BorrowerMismatch.selector);
        _openLoanAs(bob, 100, keccak256("root-2"), encodedTx);
    }

    function test_OpenLoan_RevertsOnUntrustedLogSource() public {
        address impostor = makeAddr("impostor");
        bytes32 loanId = keccak256("loan-3");
        bytes memory encodedTx = _buildEncodedTx(impostor, alice, loanId, keccak256("c"), 1);

        vm.expectRevert(LoanBook.UntrustedLogSource.selector);
        _openLoanAs(alice, 100, keccak256("root-3"), encodedTx);
    }

    function test_OpenLoan_RevertsWhenNoMatchingLog() public {
        bytes32 loanId = keccak256("loan-4");
        bytes memory encodedTx =
            _buildEncodedTxWithTopic(keccak256("SomeOtherEvent()"), sourceVault, alice, loanId, keccak256("c"), 1);

        vm.expectRevert(LoanBook.NoCollateralCommittedLog.selector);
        _openLoanAs(alice, 100, keccak256("root-4"), encodedTx);
    }

    function test_OpenLoan_RevertsWhenAlreadyOpen() public {
        bytes32 loanId = keccak256("loan-5");
        bytes memory encodedTx = _buildEncodedTx(sourceVault, alice, loanId, keccak256("c"), 1);

        // Two distinct queryIds (different blockHeight/merkleRoot) decoding to the
        // same loanId — exercises our own defense-in-depth check independently of
        // ASCBase's per-proof replay dedup.
        assertTrue(_openLoanAs(alice, 100, keccak256("root-5a"), encodedTx));

        vm.expectRevert(LoanBook.LoanAlreadyOpen.selector);
        _openLoanAs(alice, 200, keccak256("root-5b"), encodedTx);
    }

    function test_OpenLoan_RevertsWhenVerificationFails() public {
        _setVerifierResult(false);
        bytes32 loanId = keccak256("loan-6");
        bytes memory encodedTx = _buildEncodedTx(sourceVault, alice, loanId, keccak256("c"), 1);

        vm.expectRevert("Proof of inclusion verification failed");
        _openLoanAs(alice, 100, keccak256("root-6"), encodedTx);
    }

    function test_ReplayProtection_RevertsOnIdenticalProof() public {
        bytes32 loanId = keccak256("loan-7");
        bytes memory encodedTx = _buildEncodedTx(sourceVault, alice, loanId, keccak256("c"), 1);

        assertTrue(_openLoanAs(alice, 100, keccak256("root-7"), encodedTx));

        vm.expectRevert("Query already processed");
        _openLoanAs(alice, 100, keccak256("root-7"), encodedTx);
    }

    function test_Execute_DirectCallReverts() public {
        bytes32 loanId = keccak256("loan-8");
        bytes memory encodedTx = _buildEncodedTx(sourceVault, alice, loanId, keccak256("c"), 1);
        INativeQueryVerifier.MerkleProofEntry[] memory siblings = new INativeQueryVerifier.MerkleProofEntry[](0);
        bytes32[] memory continuityRoots = new bytes32[](0);

        vm.prank(alice);
        vm.expectRevert(LoanBook.UnauthorizedCaller.selector);
        loanBook.execute(
            1, SOURCE_CHAIN_KEY, 100, encodedTx, keccak256("root-8"), siblings, bytes32(0), continuityRoots
        );
    }

    function _openTier1Loan(address borrower, bytes32 loanId) internal {
        bytes memory encodedTx = _buildEncodedTx(sourceVault, borrower, loanId, keccak256(abi.encode(loanId)), 1);
        assertTrue(_openLoanAs(borrower, 100, keccak256(abi.encode("root", loanId)), encodedTx));
    }

    function test_Draw_MintsUpToCapThenReverts() public {
        bytes32 loanId = keccak256("loan-draw");
        _openTier1Loan(alice, loanId);

        vm.prank(alice);
        loanBook.draw(loanId, 30 ether);
        assertEq(stable.balanceOf(alice), 30 ether);
        (,, uint256 debt,) = loanBook.loans(loanId);
        assertEq(debt, 30 ether);

        vm.prank(alice);
        vm.expectRevert(LoanBook.DrawExceedsCap.selector);
        loanBook.draw(loanId, 21 ether); // 30 + 21 > 50 (tier 1 cap)
    }

    function test_Draw_RevertsForNonBorrower() public {
        bytes32 loanId = keccak256("loan-draw-2");
        _openTier1Loan(alice, loanId);

        vm.prank(bob);
        vm.expectRevert(LoanBook.NotBorrower.selector);
        loanBook.draw(loanId, 10 ether);
    }

    function test_Repay_BurnsAndReducesDebt() public {
        bytes32 loanId = keccak256("loan-repay");
        _openTier1Loan(alice, loanId);

        vm.prank(alice);
        loanBook.draw(loanId, 50 ether);

        vm.prank(alice);
        stable.approve(address(loanBook), 20 ether);
        vm.prank(alice);
        loanBook.repay(loanId, 20 ether);

        assertEq(stable.balanceOf(alice), 30 ether);
        (,, uint256 debt,) = loanBook.loans(loanId);
        assertEq(debt, 30 ether);
    }

    function test_Repay_RevertsForNonBorrower() public {
        bytes32 loanId = keccak256("loan-repay-3");
        _openTier1Loan(alice, loanId);

        vm.prank(alice);
        loanBook.draw(loanId, 10 ether);

        vm.prank(bob);
        vm.expectRevert(LoanBook.NotBorrower.selector);
        loanBook.repay(loanId, 5 ether);
    }

    function test_Repay_RevertsWhenExceedingDebt() public {
        bytes32 loanId = keccak256("loan-repay-2");
        _openTier1Loan(alice, loanId);

        vm.prank(alice);
        loanBook.draw(loanId, 10 ether);

        vm.prank(alice);
        stable.approve(address(loanBook), 50 ether);
        vm.prank(alice);
        vm.expectRevert(LoanBook.RepayExceedsDebt.selector);
        loanBook.repay(loanId, 11 ether);
    }
}
