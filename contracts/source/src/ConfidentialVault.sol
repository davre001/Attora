// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Locks RWA collateral and emits a commitment + tier instead of the
/// raw amount. Attestcoin proves this event's existence on Creditcoin; the
/// exact size never has to leave this contract's storage.
contract ConfidentialVault {
    using SafeERC20 for IERC20;

    struct Commitment {
        bytes32 commitment;
        uint8 tier;
        address borrower;
        bool active;
    }

    uint256 public constant TIER_1_MIN = 100 ether;
    uint256 public constant TIER_2_MIN = 1_000 ether;
    uint256 public constant TIER_3_MIN = 10_000 ether;

    IERC20 public immutable token;

    mapping(bytes32 => Commitment) public commitments;

    event CollateralCommitted(address indexed borrower, bytes32 indexed loanId, bytes32 commitment, uint8 tier);

    error BelowMinimumTier();
    error LoanIdAlreadyUsed();
    error NotBorrower();

    constructor(IERC20 _token) {
        token = _token;
    }

    function tierFor(uint256 amount) public pure returns (uint8) {
        if (amount >= TIER_3_MIN) return 3;
        if (amount >= TIER_2_MIN) return 2;
        if (amount >= TIER_1_MIN) return 1;
        return 0;
    }

    /// @dev `amount` is plaintext in this call's calldata — Sepolia itself
    /// isn't a confidential chain. What stays hidden is the *log*: only the
    /// commitment hash and tier are emitted, which is what Creditcoin proves.
    function commit(uint256 amount, bytes32 salt, bytes32 loanId) external {
        uint8 tier = tierFor(amount);
        if (tier == 0) revert BelowMinimumTier();
        if (commitments[loanId].active) revert LoanIdAlreadyUsed();

        token.safeTransferFrom(msg.sender, address(this), amount);

        bytes32 commitment = keccak256(abi.encodePacked(amount, salt, msg.sender, loanId));
        commitments[loanId] = Commitment({commitment: commitment, tier: tier, borrower: msg.sender, active: true});

        emit CollateralCommitted(msg.sender, loanId, commitment, tier);
    }

    /// @notice Off-band verification that a claimed (amount, salt) matches
    /// the stored commitment. Never called as part of the loan path.
    function reveal(bytes32 loanId, uint256 amount, bytes32 salt) external view returns (bool) {
        Commitment storage c = commitments[loanId];
        if (msg.sender != c.borrower) revert NotBorrower();
        return c.commitment == keccak256(abi.encodePacked(amount, salt, c.borrower, loanId));
    }
}
