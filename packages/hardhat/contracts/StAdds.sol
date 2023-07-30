// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./lib/EllipticCurve.sol";
import "./lib/Errors.sol";
import "./lib/Events.sol"; 

/**@title StAdds
 * A contract that creats a Stealth Address and keeps track of shared secrets
 */ 
contract StAdds is Events {
  // users can add a Shared Secret every 10 minutes
  uint256 public constant timeLock = 10 minutes;
  address public owner;
  address public pendingOwner;
  EC public ec;

  // Elliptic Curve point
  struct Point {
    bytes32 x;
    bytes32 y;
  }
  struct SharedSecret {
    bytes32 x;
    bytes32 y;
    address creator;
  }

  mapping (address => Point) publicKeys;
  mapping (address => SharedSecret[]) sharedSecrets;
  // cheaper than iterating over big arrays
  mapping (bytes => bool) isSharedSecretProvided;
  mapping (address => uint256) timeStamps;

  constructor() payable {
    owner = msg.sender;
    ec = new EC();
  }

  /**
   * @dev Only sender can provide their public key
   * @param publicKeyX - x coordinate of the public key
   * @param publicKeyY - y coordinate of the public key
   */
  function addPublicKey(bytes32 publicKeyX, bytes32 publicKeyY) external {
    if (isPublicKeyProvided(msg.sender)) revert Errors.PublicKeyProvided();
    bytes memory publicKey = abi.encodePacked(publicKeyX, publicKeyY);
    // 0x00FF... is a mask to get the address from the hashed public key
    bool isSender = (uint256(keccak256(publicKey)) & 0x00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) == uint256(uint160(msg.sender));
    if (!isSender) revert Errors.NotSender();
    publicKeys[msg.sender] = Point(publicKeyX, publicKeyY);
    emit NewPublicKey(msg.sender, publicKeyX, publicKeyY);
  }

  /**
   * @notice Remove sender's public key
   */
  function removePublicKey() external {
    if (!isPublicKeyProvided(msg.sender)) revert Errors.PublicKeyNotProvided();
    delete publicKeys[msg.sender];
    emit PublicKeyRemoved(msg.sender);
  }

  /**
   * @notice Add a Shared Secret
   * this creates a link between the sender and the receiver
   * @param receiver - address of the receiver
   * @param sharedSecretX - x coordinate of the Shared Secret
   * @param sharedSecretY - y coordinate of the Shared Secret
   */
  function addSharedSecret(
    address receiver,
    bytes32 sharedSecretX, 
    bytes32 sharedSecretY
  ) external {
    if (doesSharedSecretExist(
      sharedSecretX, 
      sharedSecretY
    )) revert Errors.SharedSecretExists();
    uint256 allowedTime = timeStamps[msg.sender];
    if (allowedTime != 0 && allowedTime > block.timestamp) revert Errors.SharedSecretCooldown();
    sharedSecrets[receiver].push(SharedSecret(
      sharedSecretX, 
      sharedSecretY,
      msg.sender
    ));
    timeStamps[msg.sender] = block.timestamp + timeLock;
    emit NewSharedSecret(
      msg.sender, 
      receiver, 
      sharedSecretX, 
      sharedSecretY
    ); 
  }

  /**
   * @notice Remove a shared secret
   * @param index - index of the shared secret
   * in the sharedSecret mapping
   */
  function removeSharedSecret(uint256 index) external {
    SharedSecret[] storage ShS = sharedSecrets[msg.sender];
    uint256 len = ShS.length;
    if (len == 0 || index >= len) revert Errors.WrongIndex();
    bytes32 ShSX = ShS[index].x;
    bytes32 ShSY = ShS[index].y;
    if (ShSX == 0 && ShSY == 0) revert Errors.WrongIndex();
    delete ShS[index];
    bytes memory ShSLong = abi.encodePacked(ShSX, ShSY);
    delete isSharedSecretProvided[ShSLong];
    emit SharedSecretRemoved(msg.sender, index);
  }

  /**
   * @notice Get stealth address from a public key
   * stored in the contract
   * @param secret - salt to generate a stealth address
   */
  function getStealthAddressFromAddress(
    address recipientAddress, 
    string calldata secret
  ) external view returns (
    address stealthAddress, 
    bytes32 sharedSecretX,
    bytes32 sharedSecretY
  ) {
    Point storage publicKey = publicKeys[recipientAddress];
    bytes32 publicKeyX = publicKey.x;
    bytes32 publicKeyY = publicKey.y;
    if (
      publicKeyX == 0x0 && 
      publicKeyY == 0x0
    ) revert Errors.PublicKeyNotProvided();

    bytes32 secretToNumber = keccak256(bytes(secret));

    Point memory sharedSecretPoint;
    (sharedSecretPoint.x, sharedSecretPoint.y) = ec.mul(
      secretToNumber, 
      publicKeyX, 
      publicKeyY
    );
    bytes32 sharedSecretPointToNumber = keccak256(abi.encodePacked(
      sharedSecretPoint.x, 
      sharedSecretPoint.y
    ));
    Point memory sharedSecretGPoint;
    (sharedSecretGPoint.x, sharedSecretGPoint.y) = ec.mulG(sharedSecretPointToNumber);

    Point memory stealthPublicKey;
    (stealthPublicKey.x, stealthPublicKey.y) = ec.add(
      publicKeyX, 
      publicKeyY, 
      sharedSecretGPoint.x, 
      sharedSecretGPoint.y
    );
    uint256 stealthPublicKeyToNumber = uint256(keccak256(abi.encodePacked(
      stealthPublicKey.x, 
      stealthPublicKey.y
    )));

    stealthAddress = address(uint160(stealthPublicKeyToNumber) & 0x00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF);

    (sharedSecretX, sharedSecretY) = ec.mulG(secretToNumber);
  }

  /**
   * @notice Get stealth address from a public key
   * @param secret - salt to generate a stealth address
   */
  function getStealthAddressFromPublicKey(
    bytes32 publicKeyX,
    bytes32 publicKeyY, 
    string calldata secret
  ) external view returns (
    address stealthAddress, 
    bytes32 sharedSecretX,
    bytes32 sharedSecretY
  ) {
    if (
      publicKeyX == 0x0 && 
      publicKeyY == 0x0
    ) revert Errors.PublicKeyNotProvided();

    bytes32 secretToNumber = keccak256(bytes(secret));

    Point memory sharedSecretPoint;
    (sharedSecretPoint.x, sharedSecretPoint.y) = ec.mul(
      secretToNumber, 
      publicKeyX, 
      publicKeyY
    );
    bytes32 sharedSecretPointToNumber = keccak256(abi.encodePacked(
      sharedSecretPoint.x, 
      sharedSecretPoint.y
    ));
    Point memory sharedSecretGPoint;
    (sharedSecretGPoint.x, sharedSecretGPoint.y) = ec.mulG(sharedSecretPointToNumber);

    Point memory stealthPublicKey;
    (stealthPublicKey.x, stealthPublicKey.y) = ec.add(
      publicKeyX, 
      publicKeyY, 
      sharedSecretGPoint.x, 
      sharedSecretGPoint.y
    );
    uint256 stealthPublicKeyToNumber = uint256(keccak256(abi.encodePacked(
      stealthPublicKey.x, 
      stealthPublicKey.y
    )));

    stealthAddress = address(uint160(stealthPublicKeyToNumber) & 0x00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF);

    (sharedSecretX, sharedSecretY) = ec.mulG(secretToNumber);
  }

  /**
   * @notice Get stealth address
   */  
  function getStealthPrivateKey(
    bytes32 privateKey,
    bytes32 sharedSecretX,
    bytes32 sharedSecretY
  ) external view returns (bytes32 stealthPrivateKey) {
    // Biggest number allowed
    // https://ethereum.stackexchange.com/questions/10055/is-each-ethereum-address-shared-by-theoretically-2-96-private-keys
    uint256 modulo = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;

    Point memory sharedSecretPoint;
    (sharedSecretPoint.x, sharedSecretPoint.y) = ec.mul(
      privateKey, 
      sharedSecretX, 
      sharedSecretY
    ); 
    uint256 sharedSecretPointToNumber = uint256(keccak256(abi.encodePacked(
      sharedSecretPoint.x, 
      sharedSecretPoint.y
    )));

    unchecked {
      stealthPrivateKey = bytes32(addmod(
        uint256(privateKey), 
        sharedSecretPointToNumber,
        modulo
      ));
    }
  }

  function withdraw() external payable OnlyOwner {
    uint256 funds = address(this).balance;
    if (funds == 0) revert Errors.NotEnoughMATIC();
    (bool s,) = msg.sender.call{value: funds}("");
    if (!s) revert();
    emit FundsWithdrawn(msg.sender, funds);
  }

  function proposeOwner(address _addr) external payable OnlyOwner {
    pendingOwner = _addr;
    emit NewOwnerProposed(msg.sender, _addr);
  }

  function acceptOwnership() external payable {
    if (pendingOwner != msg.sender) revert Errors.NotOwner();
    owner = msg.sender;
    delete pendingOwner;
    emit OwnershipAccepted(msg.sender);
  }

  /**
   * @notice returns the public key of _addr
   */
  function getPublicKey(address _addr) external view returns (Point memory) {
    return publicKeys[_addr];
  }

  /**
   * @notice returns all shared secrets of _addr
   */
  function getSharedSecrets(address _addr) external view returns (SharedSecret[] memory) {
    return sharedSecrets[_addr];
  }

  /**
   * @notice returns the timestamp of _addr
   */
  function getTimestamp(address _addr) external view returns (uint256) {
    return timeStamps[_addr];
  }

  function isPublicKeyProvided(address _addr) internal view returns (bool) {
    Point storage PBK = publicKeys[_addr];
    return (PBK.x != 0 && PBK.y != 0);
  }

  function doesSharedSecretExist( 
    bytes32 sharedSecretX,
    bytes32 sharedSecretY
  ) internal view returns (bool) {
    bytes memory sharedSecretLong = abi.encodePacked(
      sharedSecretX, 
      sharedSecretY
    );
    return isSharedSecretProvided[sharedSecretLong];
  } 

  modifier OnlyOwner {
    if (msg.sender != owner) revert Errors.NotOwner();
    _;
  }

  receive() external payable {}
}

contract EC {
  uint256 public constant GX = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798;
  uint256 public constant GY = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8;
  uint256 public constant AA = 0;
  uint256 public constant BB = 7;
  uint256 public constant PP = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;

  /**
   * @dev Multiplies scalar _k and an ec point
   */
  function mul(
    bytes32 _k, 
    bytes32 _x, 
    bytes32 _y
  ) external pure returns (
    bytes32 qx, 
    bytes32 qy
  ) {
    (uint256 x, uint256 y) = EllipticCurve.ecMul(
      uint256(_k),
      uint256(_x),
      uint256(_y),
      AA,
      PP
    );

    qx = bytes32(x);
    qy = bytes32(y);
  }

  /**
   * @dev Multiplies scalar _k and a generator point G
   */
  function mulG(bytes32 _k) external pure returns (
    bytes32 qx, 
    bytes32 qy
  ) {
    (uint256 x, uint256 y) = EllipticCurve.ecMul(
      uint256(_k),
      GX,
      GY,
      AA,
      PP
    );

    qx = bytes32(x);
    qy = bytes32(y);
  }

  function add(
    bytes32 _x1, 
    bytes32 _y1, 
    bytes32 _x2, 
    bytes32 _y2
  ) external pure returns (
    bytes32 qx, 
    bytes32 qy
  ) {
    (uint256 x, uint256 y) = EllipticCurve.ecAdd(
      uint256(_x1),
      uint256(_y1),
      uint256(_x2),
      uint256(_y2),
      AA,
      PP
    );

    qx = bytes32(x);
    qy = bytes32(y);
  }
}