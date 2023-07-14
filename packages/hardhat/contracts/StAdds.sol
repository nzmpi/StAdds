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
  struct PublishedData {
    bytes32 x;
    bytes32 y;
    address creator;
  }

  address public owner;
  address public pendingOwner;
  uint256 public constant timeLock = 10 minutes; // 10 minutes;

  mapping (address => Point) publicKeys;
  mapping (address => PublishedData[]) publishedData;
  mapping (address => uint256) timeStamps;

  constructor() payable {
    owner = msg.sender;
    publicKeys[0x5B38Da6a701c568545dCfcB03FcB875f56beddC4] = Point(
      0x68cb0cffc92a03959e6fdc99a24f8c94143050099ca104863528c25e3c024f61,
      0xa7049e09e669397f43d0fd63432b5b358f3d0caaf03b34acbcdc7f2cbe227db9
    );
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
  ) external {
    if (!isPubKeyProvided(receiver)) revert Errors.PublicKeyNotProvided();
    if (doesPublishedDataExist(
      receiver, 
      publishedDataX, 
      publishedDataY
    )) revert Errors.PublishedDataExists();
    uint256 allowedTime = timeStamps[msg.sender];
    if (allowedTime != 0 && allowedTime > block.timestamp) revert Errors.PublishedDataCooldown();
    publishedData[receiver].push(PublishedData(
      publishedDataX, 
      publishedDataY,
      msg.sender
    ));
    timeStamps[msg.sender] = block.timestamp + timeLock;
    emit NewPublishedData(msg.sender, receiver, publishedDataX, publishedDataY); 
  }

  function removePublishedData(uint256 index) external {
    PublishedData[] storage PDs = publishedData[msg.sender];
    uint256 len = PDs.length;
    if (len == 0) revert Errors.WrongIndex();
    if (index >= len) revert Errors.WrongIndex();
    if (PDs[index].x == 0 && PDs[index].y == 0) revert Errors.WrongIndex();
    delete PDs[index];
    emit PublishedDataRemoved(msg.sender, index);
  }

  function getPublishedData(address _addr) external view returns (PublishedData[] memory) {
    return publishedData[_addr];
  }

  function withdraw() external payable OnlyOwner {
    uint256 funds = address(this).balance;
    if (funds == 0) revert Errors.NotEnoughMATIC();
    (bool s,) = msg.sender.call{value: address(this).balance}("");
    if (!s) revert();
    emit FundsWithdrawn(msg.sender, funds);
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

  function getTimestamp(address _addr) external view returns (uint256) {
    return timeStamps[_addr];
  }

  function isPubKeyProvided(address _addr) internal view returns (bool) {
    Point storage PBK = publicKeys[_addr];
    return (PBK.x != 0 && PBK.y != 0);
  }

  function doesPublishedDataExist(
    address receiver, 
    bytes32 dataX,
    bytes32 dataY
  ) internal view returns (bool) {
    PublishedData[] storage PDs = publishedData[receiver];
    uint256 len = PDs.length;
    if (len == 0) return false;
    for (uint256 i; i < len;) {
      if (
        PDs[i].x == dataX &&
        PDs[i].y == dataY
      )
        return true;
      unchecked {++i;}
    }

    return false;
  } 

  modifier OnlyOwner {
    if (msg.sender != owner) revert Errors.NotOwner();
    _;
  }

  receive() external payable {}
}