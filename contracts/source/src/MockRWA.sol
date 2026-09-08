// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Testnet stand-in for a tokenized RWA. Mint is unrestricted since
/// this token carries no real value — Sepolia/local-dev only.
contract MockRWA is ERC20 {
    constructor() ERC20("Mock RWA", "mRWA") {
        _mint(msg.sender, 1_000_000 ether);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
