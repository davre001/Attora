// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {MockRWA} from "../src/MockRWA.sol";
import {ConfidentialVault} from "../src/ConfidentialVault.sol";

/// @notice Local/testnet deploy for worker dev. Defaults to Anvil's well-known
/// account #0 key so `forge script` works against a fresh `anvil` with no setup.
contract Deploy is Script {
    uint256 constant ANVIL_ACCOUNT_0_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    function run() external {
        uint256 deployerKey = vm.envOr("DEPLOYER_PRIVATE_KEY", ANVIL_ACCOUNT_0_KEY);
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        MockRWA token = new MockRWA();
        ConfidentialVault vault = new ConfidentialVault(token);
        token.approve(address(vault), type(uint256).max);

        vm.stopBroadcast();

        console2.log("Deployer:          ", deployer);
        console2.log("MockRWA:           ", address(token));
        console2.log("ConfidentialVault: ", address(vault));
    }
}
