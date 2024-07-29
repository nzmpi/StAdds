//SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IStAdds interface
 * @author https://github.com/nzmpi
 */
interface IStAdds {
    // Elliptic Curve point
    struct Point {
        bytes32 x;
        bytes32 y;
    }

    // Shared Secret
    struct SharedSecret {
        bytes32 x;
        bytes32 y;
        address creator;
    }

    // EVENTS
    event NewPublicKey(address indexed sender, bytes32 PBx, bytes32 PBy);
    event PublicKeyRemoved(address indexed sender);
    event NewSharedSecret(
        address indexed sender, address indexed receiver, bytes32 sharedSecretX, bytes32 sharedSecretY
    );
    event SharedSecretRemoved(address indexed sender, uint256 indexed index);
    event FundsWithdrawn(address indexed sender, uint256 amount);
    event NewOwnerProposed(address indexed owner, address indexed newOwner);
    event OwnershipAccepted(address indexed owner);

    // ERRORS
    error NotOwner();
    error NotSender();
    error PublicKeyProvided();
    error PublicKeyNotProvided();
    error NotEnoughMATIC();
    error WrongIndex();
    error SharedSecretExists();
    error SharedSecretCooldown();

    // METHODS
    /**
     * Returns time lock
     * @notice Users can add a Shared Secret every 10 minutes
     * @return time lock in seconds
     */
    function timeLock() external view returns (uint256);
    /**
     * Returns owner
     * @return owner
     */
    function owner() external view returns (address);
    /**
     * Returns pending owner
     * @return pending owner
     */
    function pendingOwner() external view returns (address);
    /**
     * Adds user's public key
     * @dev Only msg.sender can provide their public key
     * @param publicKeyX - x coordinate of the public key
     * @param publicKeyY - y coordinate of the public key
     */
    function addPublicKey(bytes32 publicKeyX, bytes32 publicKeyY) external;
    /**
     * Removes user's public key
     */
    function removePublicKey() external;
    /**
     * Adds Shared Secret
     * @notice This creates a "link" between the sender and the receiver,
     * but the stealth address is still unknown
     * @param receiver - the address of the receiver
     * @param sharedSecretX - x coordinate of Shared Secret
     * @param sharedSecretY - y coordinate of Shared Secret
     */
    function addSharedSecret(address receiver, bytes32 sharedSecretX, bytes32 sharedSecretY) external;
    /**
     * Removes Shared Secret
     * @param index - index of the shared secret in the sharedSecrets mapping
     */
    function removeSharedSecret(uint256 index) external;
    /**
     * Gets a stealth address from a public key stored in the contract
     * @param recipientAddress - the address of the recipient
     * @param secret - salt to generate a stealth address
     * @return stealthAddress - new stealth address
     * @return sharedSecretX - x coordinate of shared secret
     * @return sharedSecretY - y coordinate of shared secret
     */
    function getStealthAddressFromAddress(address recipientAddress, string calldata secret)
        external
        view
        returns (address stealthAddress, bytes32 sharedSecretX, bytes32 sharedSecretY);
    /**
     * Gets a stealth address from a public key
     * @param publicKeyX - x coordinate of the public key
     * @param publicKeyY - y coordinate of the public key
     * @param secret - salt to generate a stealth address
     * @return stealthAddress - new stealth address
     * @return sharedSecretX - x coordinate of shared secret
     * @return sharedSecretY - y coordinate of shared secret
     */
    function getStealthAddressFromPublicKey(bytes32 publicKeyX, bytes32 publicKeyY, string calldata secret)
        external
        view
        returns (address stealthAddress, bytes32 sharedSecretX, bytes32 sharedSecretY);
    /**
     * Gets stealth private key
     * @notice DO NOT SEND YOUR PRIVATE KEY ANYWHERE!
     * @notice COPY THIS FUNCTION AND RUN IT LOCALLY!
     * @param privateKey - private key of the receiver
     * @param sharedSecretX - x coordinate of shared secret
     * @param sharedSecretY - y coordinate of shared secret
     * @return stealthPrivateKey - stealth private key
     */
    function getStealthPrivateKey(bytes32 privateKey, bytes32 sharedSecretX, bytes32 sharedSecretY)
        external
        view
        returns (bytes32 stealthPrivateKey);
    /**
     * Withdraws funds
     * @dev Can only be called by the owner
     */
    function withdraw() external payable;
    /**
     * Proposes new owner
     * @dev Can only be called by the owner
     * @param _addr - new owner
     */
    function proposeOwner(address _addr) external payable;
    /**
     * Accepts new owner
     * @dev Can only be called by the pending owner
     */
    function acceptOwnership() external payable;
    /**
     * Returns the public key of _addr
     * @param _addr - address, which public key should be returned
     * @return Point - public key
     */
    function getPublicKey(address _addr) external view returns (Point memory);
    /**
     * Returns all shared secrets of _addr
     * @param _addr - address, which shared secrets should be returned
     * @return SharedSecret[] - An array of all shared secrets
     */
    function getSharedSecrets(address _addr) external view returns (SharedSecret[] memory);
    /**
     * Returns the timestamp of _addr
     * @param _addr - address, which timestamp should be returned
     * @return uint256 - timestamp
     */
    function getTimestamp(address _addr) external view returns (uint256);
}
