// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/// @notice Testnet stand-in for the CC3 borrowable dollar token (Ondo USDY per the
/// frontend spec). Mint is unrestricted since this token carries no real value —
/// CC3 testnet only. LoanBook.draw() mints against a loan's tier cap; repay()
/// burns from the caller's own balance.
contract MockStable is ERC20, ERC20Burnable {
    constructor() ERC20("Mock USDY", "mUSDY") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
