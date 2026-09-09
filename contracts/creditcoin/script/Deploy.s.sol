// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {MockStable} from "../src/MockStable.sol";
import {LoanBook} from "../src/LoanBook.sol";

/// @notice CC3 testnet deploy. Defaults to Anvil's well-known account #0 key for
/// local dry runs (the precompile at 0xFD2 won't exist there, so openLoan() can't
/// actually be exercised locally — see test/LoanBook.t.sol for that instead).
///
/// SOURCE_VAULT must be the deployed ConfidentialVault address on Sepolia
/// (contracts/source/script/Deploy.s.sol). SOURCE_CHAIN_KEY defaults to 1, the
/// chainKey Sepolia is registered under on CC3 testnet's ChainInfo precompile
/// (see README).
contract Deploy is Script {
    uint256 constant ANVIL_ACCOUNT_0_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    function run() external {
        uint256 deployerKey = vm.envOr("DEPLOYER_PRIVATE_KEY", ANVIL_ACCOUNT_0_KEY);
        address deployer = vm.addr(deployerKey);
        address sourceVault = vm.envAddress("SOURCE_VAULT");
        uint64 sourceChainKey = uint64(vm.envOr("SOURCE_CHAIN_KEY", uint256(1)));

        vm.startBroadcast(deployerKey);

        MockStable stable = new MockStable();
        LoanBook loanBook = new LoanBook(sourceVault, sourceChainKey, stable);

        vm.stopBroadcast();

        console2.log("Deployer:      ", deployer);
        console2.log("Source vault:  ", sourceVault);
        console2.log("Source chainKey:", sourceChainKey);
        console2.log("MockStable:    ", address(stable));
        console2.log("LoanBook:      ", address(loanBook));
    }
}
