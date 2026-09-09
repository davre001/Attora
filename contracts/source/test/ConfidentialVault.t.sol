// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ConfidentialVault} from "../src/ConfidentialVault.sol";
import {MockRWA} from "../src/MockRWA.sol";

contract ConfidentialVaultTest is Test {
    ConfidentialVault vault;
    MockRWA token;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        token = new MockRWA();
        vault = new ConfidentialVault(token);

        token.mint(alice, 1_000_000 ether);
        vm.prank(alice);
        token.approve(address(vault), type(uint256).max);
    }

    // ── tierFor ──────────────────────────────────────────────────────────

    function test_TierFor_Boundaries() public view {
        assertEq(vault.tierFor(0), 0);
        assertEq(vault.tierFor(99 ether), 0);
        assertEq(vault.tierFor(100 ether), 1);
        assertEq(vault.tierFor(999 ether), 1);
        assertEq(vault.tierFor(1_000 ether), 2);
        assertEq(vault.tierFor(9_999 ether), 2);
        assertEq(vault.tierFor(10_000 ether), 3);
        assertEq(vault.tierFor(1_000_000 ether), 3);
    }

    function testFuzz_TierFor_MatchesReferenceThresholds(uint256 amount) public view {
        amount = bound(amount, 0, 100_000 ether);
        uint8 tier = vault.tierFor(amount);

        if (amount >= 10_000 ether) {
            assertEq(tier, 3);
        } else if (amount >= 1_000 ether) {
            assertEq(tier, 2);
        } else if (amount >= 100 ether) {
            assertEq(tier, 1);
        } else {
            assertEq(tier, 0);
        }
    }

    // ── commit ───────────────────────────────────────────────────────────

    function test_Commit_Tier2_EmitsAndStores() public {
        bytes32 salt = keccak256("salt-1");
        bytes32 loanId = keccak256("loan-1");
        uint256 amount = 1_000 ether;
        bytes32 expectedCommitment = keccak256(abi.encodePacked(amount, salt, alice, loanId));

        vm.expectEmit(true, true, false, true, address(vault));
        emit ConfidentialVault.CollateralCommitted(alice, loanId, expectedCommitment, 2);

        vm.prank(alice);
        vault.commit(amount, salt, loanId);

        (bytes32 commitment, uint8 tier, address borrower, bool active) = vault.commitments(loanId);
        assertEq(commitment, expectedCommitment);
        assertEq(tier, 2);
        assertEq(borrower, alice);
        assertTrue(active);
    }

    function test_Commit_PullsExactAmount() public {
        uint256 amount = 500 ether;
        uint256 vaultBefore = token.balanceOf(address(vault));
        uint256 aliceBefore = token.balanceOf(alice);

        vm.prank(alice);
        vault.commit(amount, keccak256("s"), keccak256("l"));

        assertEq(token.balanceOf(address(vault)), vaultBefore + amount);
        assertEq(token.balanceOf(alice), aliceBefore - amount);
    }

    function testFuzz_Commit_RevertsBelowMinimumTier(uint256 amount) public {
        amount = bound(amount, 0, 100 ether - 1);

        vm.prank(alice);
        vm.expectRevert(ConfidentialVault.BelowMinimumTier.selector);
        vault.commit(amount, keccak256("s"), keccak256("l"));
    }

    function test_Commit_RevertsOnReusedLoanId() public {
        bytes32 loanId = keccak256("loan-reuse");

        vm.prank(alice);
        vault.commit(100 ether, keccak256("s1"), loanId);

        // Different amount/salt, same loanId — still must revert.
        vm.prank(alice);
        vm.expectRevert(ConfidentialVault.LoanIdAlreadyUsed.selector);
        vault.commit(10_000 ether, keccak256("s2"), loanId);
    }

    function test_Commit_RevertsWithoutAllowance() public {
        vm.prank(bob); // bob never approved the vault
        vm.expectRevert();
        vault.commit(100 ether, keccak256("s"), keccak256("l"));
    }

    function test_Commit_RevertsWithInsufficientBalance() public {
        vm.prank(bob);
        token.approve(address(vault), type(uint256).max);

        vm.prank(bob); // bob holds 0 tokens
        vm.expectRevert();
        vault.commit(100 ether, keccak256("s"), keccak256("l"));
    }

    // ── reveal ───────────────────────────────────────────────────────────

    function test_Reveal_TrueForMatchingPair() public {
        uint256 amount = 250 ether;
        bytes32 salt = keccak256("reveal-salt");
        bytes32 loanId = keccak256("reveal-loan");

        vm.prank(alice);
        vault.commit(amount, salt, loanId);

        vm.prank(alice);
        assertTrue(vault.reveal(loanId, amount, salt));
    }

    function test_Reveal_FalseForWrongAmount() public {
        bytes32 salt = keccak256("reveal-salt-2");
        bytes32 loanId = keccak256("reveal-loan-2");

        vm.prank(alice);
        vault.commit(100 ether, salt, loanId);

        vm.prank(alice);
        assertFalse(vault.reveal(loanId, 999 ether, salt));
    }

    function test_Reveal_RevertsForNonBorrower() public {
        bytes32 loanId = keccak256("reveal-loan-3");

        vm.prank(alice);
        vault.commit(100 ether, keccak256("s"), loanId);

        vm.prank(bob);
        vm.expectRevert(ConfidentialVault.NotBorrower.selector);
        vault.reveal(loanId, 100 ether, keccak256("s"));
    }
}

contract MockRWATest is Test {
    MockRWA token;

    function setUp() public {
        token = new MockRWA();
    }

    function test_Constructor_MintsInitialSupplyToDeployer() public view {
        assertEq(token.balanceOf(address(this)), 1_000_000 ether);
    }

    function testFuzz_Mint_IsUnrestricted(address to, uint256 amount) public {
        vm.assume(to != address(0));
        amount = bound(amount, 0, type(uint128).max);

        uint256 before = token.balanceOf(to);
        token.mint(to, amount); // called from an arbitrary test contract, not the deployer
        assertEq(token.balanceOf(to), before + amount);
    }
}
