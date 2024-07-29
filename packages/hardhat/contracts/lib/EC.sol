// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./EllipticCurve.sol";

/**
 * @title secp256k1 elliptic curve
 * @dev Wrapper library providing arithmetic operations over elliptic curves
 * @author https://github.com/nzmpi
 */
contract EC {
    // secp256k1 elliptic curve parameters
    uint256 public constant GX = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798;
    uint256 public constant GY = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8;
    uint256 public constant AA = 0;
    uint256 public constant BB = 7;
    uint256 public constant PP = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;

    /**
     * @dev Multiplies a scalar _k and an ec point P
     * @param _k - scalar
     * @param _x - x coordinate of P
     * @param _y - y coordinate of P
     * @return qx - x coordinate of _k * P
     * @return qy - y coordinate of _k * P
     */
    function mul(bytes32 _k, bytes32 _x, bytes32 _y) external pure returns (bytes32 qx, bytes32 qy) {
        (uint256 x, uint256 y) = EllipticCurve.ecMul(uint256(_k), uint256(_x), uint256(_y), AA, PP);

        qx = bytes32(x);
        qy = bytes32(y);
    }

    /**
     * @dev Multiplies a scalar _k and a generator point G
     * @param _k - scalar
     * @return qx - x coordinate of _k * G
     * @return qy - y coordinate of _k * G
     */
    function mulG(bytes32 _k) external pure returns (bytes32 qx, bytes32 qy) {
        (uint256 x, uint256 y) = EllipticCurve.ecMul(uint256(_k), GX, GY, AA, PP);

        qx = bytes32(x);
        qy = bytes32(y);
    }

    /**
     * Add two ec points P1 and P2
     * @param _x1 - x coordinate of P1
     * @param _y1 - y coordinate of P1
     * @param _x2 - x coordinate of P2
     * @param _y2 - y coordinate of P2
     * @return qx - x coordinate of P1 + P2
     * @return qy - y coordinate of P1 + P2
     */
    function add(bytes32 _x1, bytes32 _y1, bytes32 _x2, bytes32 _y2) external pure returns (bytes32 qx, bytes32 qy) {
        (uint256 x, uint256 y) = EllipticCurve.ecAdd(uint256(_x1), uint256(_y1), uint256(_x2), uint256(_y2), AA, PP);

        qx = bytes32(x);
        qy = bytes32(y);
    }
}
