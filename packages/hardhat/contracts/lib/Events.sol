//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract Events {
  event NewPublicKey(address indexed sender, bytes32 PBx, bytes32 PBy);
  event PublicKeyRemoved(address indexed sender);
  event NewSharedSecret(
    address indexed sender, 
    address indexed receiver,
    bytes32 sharedSecretX, 
    bytes32 sharedSecretY
  );
  event SharedSecretRemoved(
    address indexed sender,
    uint256 indexed index
  );
  event FundsWithdrawn(address indexed sender, uint256 amount);
  event NewOwnerProposed(address indexed owner, address indexed newOwner);
  event OwnershipAccepted(address indexed owner);
}
