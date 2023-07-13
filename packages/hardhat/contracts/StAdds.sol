// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./lib/Errors.sol";
import "./lib/Events.sol"; 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/**
 * @title StealthNFT
 * A contract that allows to create a stealth address and
 * mint NFTs to that address
 */
contract StAdds is Events {
  // Elliptic Curve point
  struct Point {
    bytes32 x;
    bytes32 y;
  }

  address public owner;
  address public pendingOwner;
  uint256 public dataFee = 0.001 ether;
  uint256 fees;

  mapping (address => Point) publicKeys;
  mapping (address => Point[]) publishedData;
  mapping (address => uint256) funds;

  constructor() payable {
    owner = msg.sender;
  }

  /**
   * @dev Only signer can provide their public key
   * @param publicKeyX - x coordinate of the public key
   * @param publicKeyY - y coordinate of the public key
   */
  function addPublicKey(bytes32 publicKeyX, bytes32 publicKeyY) external {
    if (isPubKeyProvided(msg.sender)) revert Errors.PublicKeyProvided();
    bytes memory publicKey = abi.encodePacked(publicKeyX, publicKeyY);
    // 0x00FF... is a mask to get the address from the hashed public key
    bool isSigner = (uint256(keccak256(publicKey)) & 0x00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) == uint256(uint160(msg.sender));
    if (!isSigner) revert Errors.NotSinger();
    publicKeys[msg.sender] = Point(publicKeyX, publicKeyY);
    emit NewPublicKey(msg.sender, publicKeyX, publicKeyY);
  }

  function removePublicKey() external {
    if (!isPubKeyProvided(msg.sender)) revert Errors.PublicKeyNotProvided();
    delete publicKeys[msg.sender];
    emit PublicKeyRemoved(msg.sender);
  }

  function addPublishedData(
    address receiver,
    bytes32 publishedDataX, 
    bytes32 publishedDataY
  ) external payable {
    if (msg.value != dataFee) revert Errors.NotEnoughMATIC();
    if (!isPubKeyProvided(receiver)) revert Errors.PublicKeyNotProvided();
    uint256 fee = msg.value/2;
    fees = fees + fee; // gas savings
    funds[receiver] += fee;
    publishedData[receiver].push(Point(publishedDataX, publishedDataY));
    emit NewPublishedData(msg.sender, receiver, publishedDataX, publishedDataY); 
  }

  function removePublishedData(uint256 index) external {
    Point[] storage PDs = publishedData[msg.sender];
    uint256 len = PDs.length;
    if (len == 0) revert Errors.WrongIndex();
    if (index >= len) revert Errors.WrongIndex();
    if (PDs[index].x == 0 && PDs[index].y == 0) revert Errors.WrongIndex();
    delete PDs[index];
    emit PublishedDataRemoved(msg.sender, index);
  }

  function withdrawFunds() external {
    uint256 funds_ = funds[msg.sender];
    if (funds_ == 0) revert Errors.NotEnoughMATIC();
    delete funds[msg.sender];
    (bool s,) = msg.sender.call{value: funds_}("");
    if (!s) revert();
    emit FundsWithdrawn(msg.sender, funds_);
  }

  function withdraw() external payable OnlyOwner {
    uint256 funds_ = fees;
    if (funds_ == 0) revert Errors.NotEnoughMATIC();
    delete fees;
    (bool s,) = msg.sender.call{value: funds_}("");
    if (!s) revert();
    emit FundsWithdrawn(msg.sender, funds_);
  }

  function proposeOwner(address _addr) external OnlyOwner {
    pendingOwner = _addr;
    emit NewOwnerProposed(msg.sender, _addr);
  }

  function acceptOwnership() external {
    if (pendingOwner != msg.sender) revert Errors.NotOwner();
    owner = msg.sender;
    delete pendingOwner;
    emit OwnershipAccepted(msg.sender);
  }

  function getPublicKey(address _addr) external view returns (Point memory) {
    return publicKeys[_addr];
  }

  function getFunds(address _addr) external view returns (uint256) {
    return funds[_addr];
  }

  function isPubKeyProvided(address _addr) internal view returns (bool) {
    Point storage PBK = publicKeys[_addr];
    return (PBK.x != 0 && PBK.y != 0);
  }

  modifier OnlyOwner {
    if (msg.sender != owner) revert Errors.NotOwner();
    _;
  }

}