// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EC} from "./lib/EC.sol";
import "./interfaces/IStAdds.sol";

/**
 * @title StAdds
 * Contract that creates a Stealth Address and keeps track of shared secrets
 * @author https://github.com/nzmpi
 */
contract StAdds is IStAdds {
    // Biggest number allowed
    // https://ethereum.stackexchange.com/questions/10055/is-each-ethereum-address-shared-by-theoretically-2-96-private-keys
    uint256 constant MODULO = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
    bytes32 constant ADDRESS_MASK = 0x000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
    // users can add a Shared Secret every 10 minutes
    uint256 public constant timeLock = 10 minutes;
    address public owner;
    address public pendingOwner;
    EC public ec;

    mapping(address => Point) publicKeys;
    mapping(address => SharedSecret[]) sharedSecrets;
    mapping(bytes => bool) isSharedSecretProvided;
    mapping(address => uint256) timeStamps;

    modifier OnlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() payable {
        owner = msg.sender;
        ec = new EC();
    }

    /**
     * @inheritdoc IStAdds
     */
    function addPublicKey(bytes32 publicKeyX, bytes32 publicKeyY) external {
        if (_isPublicKeyProvided(msg.sender)) revert PublicKeyProvided();
        bytes memory publicKey = bytes.concat(publicKeyX, publicKeyY);
        bool isSender = uint256(keccak256(publicKey) & ADDRESS_MASK) == uint256(uint160(msg.sender));
        if (!isSender) revert NotSender();
        publicKeys[msg.sender] = Point(publicKeyX, publicKeyY);
        emit NewPublicKey(msg.sender, publicKeyX, publicKeyY);
    }

    /**
     * @inheritdoc IStAdds
     */
    function removePublicKey() external {
        if (!_isPublicKeyProvided(msg.sender)) revert PublicKeyNotProvided();
        delete publicKeys[msg.sender];
        emit PublicKeyRemoved(msg.sender);
    }

    /**
     * @inheritdoc IStAdds
     */
    function addSharedSecret(address receiver, bytes32 sharedSecretX, bytes32 sharedSecretY) external {
        if (_doesSharedSecretExist(sharedSecretX, sharedSecretY)) revert SharedSecretExists();
        uint256 allowedTime = timeStamps[msg.sender];
        if (allowedTime > block.timestamp) revert SharedSecretCooldown();
        sharedSecrets[receiver].push(SharedSecret(sharedSecretX, sharedSecretY, msg.sender));
        timeStamps[msg.sender] = block.timestamp + timeLock;
        emit NewSharedSecret(msg.sender, receiver, sharedSecretX, sharedSecretY);
    }

    /**
     * @inheritdoc IStAdds
     */
    function removeSharedSecret(uint256 index) external {
        SharedSecret[] storage sharedSecretArray = sharedSecrets[msg.sender];
        uint256 len = sharedSecretArray.length;
        if (len == 0 || index >= len) revert WrongIndex();
        bytes32 sharedSecretX = sharedSecretArray[index].x;
        bytes32 sharedSecretY = sharedSecretArray[index].y;
        if (sharedSecretX == 0 && sharedSecretY == 0) revert WrongIndex();
        delete sharedSecretArray[index];
        bytes memory sharedSecretLong = bytes.concat(sharedSecretX, sharedSecretY);
        delete isSharedSecretProvided[sharedSecretLong];
        emit SharedSecretRemoved(msg.sender, index);
    }

    /**
     * @inheritdoc IStAdds
     */
    function getStealthAddressFromAddress(address recipientAddress, string calldata secret)
        external
        view
        returns (address stealthAddress, bytes32 sharedSecretX, bytes32 sharedSecretY)
    {
        Point storage publicKey = publicKeys[recipientAddress];
        bytes32 publicKeyX = publicKey.x;
        bytes32 publicKeyY = publicKey.y;
        if (publicKeyX == 0x00 && publicKeyY == 0x00) revert PublicKeyNotProvided();
        (stealthAddress, sharedSecretX, sharedSecretY) =
            _getStealthAddressAndSharedSecret(publicKeyX, publicKeyY, secret);
    }

    /**
     * @inheritdoc IStAdds
     */
    function getStealthAddressFromPublicKey(bytes32 publicKeyX, bytes32 publicKeyY, string calldata secret)
        external
        view
        returns (address stealthAddress, bytes32 sharedSecretX, bytes32 sharedSecretY)
    {
        if (publicKeyX == 0x00 && publicKeyY == 0x00) revert PublicKeyNotProvided();
        (stealthAddress, sharedSecretX, sharedSecretY) =
            _getStealthAddressAndSharedSecret(publicKeyX, publicKeyY, secret);
    }

    /**
     * @inheritdoc IStAdds
     */
    function getStealthPrivateKey(bytes32 privateKey, bytes32 sharedSecretX, bytes32 sharedSecretY)
        external
        view
        returns (bytes32 stealthPrivateKey)
    {
        Point memory point;
        // privateKey * sharedSecretPoint == privateKey * secret * G
        (point.x, point.y) = ec.mul(privateKey, sharedSecretX, sharedSecretY);
        uint256 number = uint256(keccak256(bytes.concat(point.x, point.y)));

        stealthPrivateKey = bytes32(addmod(uint256(privateKey), number, MODULO));
    }

    /**
     * @inheritdoc IStAdds
     */
    function withdraw() external payable OnlyOwner {
        uint256 funds = address(this).balance;
        if (funds == 0) revert NotEnoughMATIC();
        (bool s,) = msg.sender.call{value: funds}("");
        if (!s) revert();
        emit FundsWithdrawn(msg.sender, funds);
    }

    /**
     * @inheritdoc IStAdds
     */
    function proposeOwner(address _addr) external payable OnlyOwner {
        pendingOwner = _addr;
        emit NewOwnerProposed(msg.sender, _addr);
    }

    /**
     * @inheritdoc IStAdds
     */
    function acceptOwnership() external payable {
        if (pendingOwner != msg.sender) revert NotOwner();
        owner = msg.sender;
        delete pendingOwner;
        emit OwnershipAccepted(msg.sender);
    }

    /**
     * @inheritdoc IStAdds
     */
    function getPublicKey(address _addr) external view returns (Point memory) {
        return publicKeys[_addr];
    }

    /**
     * @inheritdoc IStAdds
     */
    function getSharedSecrets(address _addr) external view returns (SharedSecret[] memory) {
        return sharedSecrets[_addr];
    }

    /**
     * @inheritdoc IStAdds
     */
    function getTimestamp(address _addr) external view returns (uint256) {
        return timeStamps[_addr];
    }

    /**
     * Gets a stealth address and shared secret
     * @param _publicKeyX - x coordinate of the public key
     * @param _publicKeyY - y coordinate of the public key
     * @param _secret - salt to generate a stealth address
     * @return stealthAddress - new stealth address
     * @return sharedSecretX - x coordinate of shared secret
     * @return sharedSecretY - y coordinate of shared secret
     */
    function _getStealthAddressAndSharedSecret(bytes32 _publicKeyX, bytes32 _publicKeyY, string calldata _secret)
        internal
        view
        returns (address stealthAddress, bytes32 sharedSecretX, bytes32 sharedSecretY)
    {
        // turn secret into a number
        bytes32 number = keccak256(bytes(_secret));
        // secret * G
        (sharedSecretX, sharedSecretY) = ec.mulG(number);

        Point memory point;
        // secret * Public key == secret * private key * G
        (point.x, point.y) = ec.mul(number, _publicKeyX, _publicKeyY);
        // turn the previous point into a number
        number = keccak256(bytes.concat(point.x, point.y));
        // the previous number * G
        (point.x, point.y) = ec.mulG(number);

        // Public key + previous point == Stealth Public Key
        (point.x, point.y) = ec.add(_publicKeyX, _publicKeyY, point.x, point.y);
        // keccak Stealth Public Key to get Stealth Address
        number = keccak256(bytes.concat(point.x, point.y));
        stealthAddress = address(uint160(uint256(number & ADDRESS_MASK)));
    }

    /**
     * Checks if _addr has public key stored in the contract
     * @param _addr - address
     * @return bool - true if _addr has public key
     */
    function _isPublicKeyProvided(address _addr) internal view returns (bool) {
        Point storage publicKey = publicKeys[_addr];
        return (publicKey.x != 0 && publicKey.y != 0);
    }

    /**
     * Checks if _addr has shared secret stored in the contract
     * @param sharedSecretX - x coordinate of shared secret
     * @param sharedSecretY - y coordinate of shared secret
     * @return bool - true if _addr has shared secret
     */
    function _doesSharedSecretExist(bytes32 sharedSecretX, bytes32 sharedSecretY) internal view returns (bool) {
        bytes memory sharedSecretLong = bytes.concat(sharedSecretX, sharedSecretY);
        return isSharedSecretProvided[sharedSecretLong];
    }

    receive() external payable {}
}
