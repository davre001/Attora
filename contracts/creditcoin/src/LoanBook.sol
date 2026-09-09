// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ASCBase} from "@gluwa/asc-contracts/contracts/readability/ASCBase.sol";
import {EvmV1Decoder} from "@gluwa/asc-contracts/contracts/common/EvmV1Decoder.sol";
import {INativeQueryVerifier} from "@gluwa/asc-contracts/contracts/write-ability/common/INativeQueryVerifier.sol";
import {MockStable} from "./MockStable.sol";

/// @notice Opens a tier-capped loan on Creditcoin CC3 against an Attestcoin-proven
/// `CollateralCommitted` event from Sepolia's ConfidentialVault — never against a
/// trusted feed or an off-chain amount. Draw/repay then happen directly on CC3.
///
/// `sourceChainKey` is fixed at construction (not caller-supplied) so a proof can
/// only ever be accepted from the one trusted source chain; the caller likewise
/// never supplies `loanId` or the borrower — both come only from the decoded,
/// proven log, so a proof can't be misattributed by a malicious/buggy caller.
contract LoanBook is ASCBase {
    uint8 internal constant ACTION_OPEN_LOAN = 1;

    bytes32 internal constant COLLATERAL_COMMITTED_TOPIC =
        keccak256("CollateralCommitted(address,bytes32,bytes32,uint8)");

    uint256 internal constant TIER_1_CAP = 50 ether;
    uint256 internal constant TIER_2_CAP = 500 ether;
    uint256 internal constant TIER_3_CAP = 5_000 ether;

    /// @notice The Sepolia ConfidentialVault whose logs this LoanBook trusts.
    /// Verifying a tx merely proves *some* Sepolia tx happened; only checking the
    /// log's emitting address restricts it to logs *our* vault actually emitted.
    address public immutable sourceVault;
    uint64 public immutable sourceChainKey;
    MockStable public immutable stable;

    struct Loan {
        address borrower;
        uint8 tier;
        uint256 debt;
        bool open;
    }

    mapping(bytes32 => Loan) public loans;

    /// @dev ASCBase.execute() is external, so calling it from openLoan() requires
    /// `this.execute(...)` — an actual external call that makes execute() see
    /// address(this) as msg.sender, not the real caller. Stage the real caller
    /// here across that one call, then read-and-clear it first thing inside
    /// _processAndEmitEvent so a stale value can never survive to a later call.
    address private _pendingCaller;

    event LoanOpened(bytes32 indexed loanId, address indexed borrower, uint8 tier, uint256 cap);
    event Drawn(bytes32 indexed loanId, uint256 amount);
    event Repaid(bytes32 indexed loanId, uint256 amount);

    error UnexpectedAction();
    error UnauthorizedCaller();
    error NoCollateralCommittedLog();
    error UntrustedLogSource();
    error BorrowerMismatch();
    error LoanAlreadyOpen();
    error InvalidTier();
    error NoSuchLoan();
    error NotBorrower();
    error DrawExceedsCap();
    error RepayExceedsDebt();

    constructor(address _sourceVault, uint64 _sourceChainKey, MockStable _stable) {
        sourceVault = _sourceVault;
        sourceChainKey = _sourceChainKey;
        stable = _stable;
    }

    /// @notice Verify a Sepolia CollateralCommitted proof and open a loan capped by
    /// its tier. Reverts (via ASCBase.execute) if the block-prover verification
    /// fails, and reverts here if the decoded borrower isn't msg.sender — so a
    /// relayer submitting on someone else's behalf can never open their loan.
    function openLoan(
        uint64 blockHeight,
        bytes calldata encodedTransaction,
        bytes32 merkleRoot,
        INativeQueryVerifier.MerkleProofEntry[] calldata siblings,
        bytes32 lowerEndpointDigest,
        bytes32[] calldata continuityRoots
    ) external returns (bool) {
        _pendingCaller = msg.sender;
        return this.execute(
            ACTION_OPEN_LOAN,
            sourceChainKey,
            blockHeight,
            encodedTransaction,
            merkleRoot,
            siblings,
            lowerEndpointDigest,
            continuityRoots
        );
    }

    function _processAndEmitEvent(
        uint8 action,
        bytes32,
        /* queryId */
        bytes memory encodedTransaction
    )
        internal
        override
    {
        address caller = _pendingCaller;
        _pendingCaller = address(0);
        if (caller == address(0)) revert UnauthorizedCaller();

        if (action != ACTION_OPEN_LOAN) revert UnexpectedAction();

        EvmV1Decoder.ReceiptFields memory receipt = EvmV1Decoder.decodeReceiptFields(encodedTransaction);
        EvmV1Decoder.LogEntry[] memory matches =
            EvmV1Decoder.getLogsByEventSignature(receipt, COLLATERAL_COMMITTED_TOPIC);

        if (matches.length != 1) revert NoCollateralCommittedLog();

        EvmV1Decoder.LogEntry memory log = matches[0];
        if (log.address_ != sourceVault) revert UntrustedLogSource();

        address borrower = address(uint160(uint256(log.topics[1])));
        bytes32 loanId = log.topics[2];
        (, uint8 tier) = abi.decode(log.data, (bytes32, uint8));

        if (borrower != caller) revert BorrowerMismatch();
        if (loans[loanId].open) revert LoanAlreadyOpen();

        uint256 cap = _capFor(tier);
        loans[loanId] = Loan({borrower: borrower, tier: tier, debt: 0, open: true});

        emit LoanOpened(loanId, borrower, tier, cap);
    }

    /// @notice Mint up to the tier cap. No proof needed — draw/repay happen
    /// directly on CC3 once the loan is open.
    function draw(bytes32 loanId, uint256 amount) external {
        Loan storage loan = loans[loanId];
        if (!loan.open) revert NoSuchLoan();
        if (loan.borrower != msg.sender) revert NotBorrower();
        if (loan.debt + amount > _capFor(loan.tier)) revert DrawExceedsCap();

        loan.debt += amount;
        stable.mint(msg.sender, amount);

        emit Drawn(loanId, amount);
    }

    /// @notice Burn drawn debt back down. Requires an ERC20 allowance on `stable`
    /// for this contract, same approve-then-pull shape as ConfidentialVault.commit().
    function repay(bytes32 loanId, uint256 amount) external {
        Loan storage loan = loans[loanId];
        if (!loan.open) revert NoSuchLoan();
        if (loan.borrower != msg.sender) revert NotBorrower();
        if (amount > loan.debt) revert RepayExceedsDebt();

        loan.debt -= amount;
        stable.burnFrom(msg.sender, amount);

        emit Repaid(loanId, amount);
    }

    function _capFor(uint8 tier) internal pure returns (uint256) {
        if (tier == 1) return TIER_1_CAP;
        if (tier == 2) return TIER_2_CAP;
        if (tier == 3) return TIER_3_CAP;
        revert InvalidTier();
    }
}
