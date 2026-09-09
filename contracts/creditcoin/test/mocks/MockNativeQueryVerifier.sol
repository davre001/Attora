// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {INativeQueryVerifier} from "@gluwa/asc-contracts/contracts/write-ability/common/INativeQueryVerifier.sol";

/// @notice Test-only stand-in for the real 0xFD2 precompile, etched at that
/// address via `vm.etch`. `result` is immutable (inlined into the deployed
/// bytecode), so `vm.etch(PRECOMPILE, address(new MockNativeQueryVerifier(x)).code)`
/// deterministically controls whether verification succeeds, without relying on
/// storage that `vm.etch` wouldn't carry over anyway.
contract MockNativeQueryVerifier {
    bool public immutable result;

    constructor(bool _result) {
        result = _result;
    }

    function verifyAndEmit(
        uint64,
        uint64,
        bytes calldata,
        INativeQueryVerifier.MerkleProof calldata,
        INativeQueryVerifier.ContinuityProof calldata
    ) external view returns (bool) {
        return result;
    }

    function calculateTxIndex(INativeQueryVerifier.MerkleProof calldata) external pure returns (uint64) {
        return 0;
    }
}
