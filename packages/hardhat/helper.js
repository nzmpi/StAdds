const { ethers } = require('hardhat'); // v5
const { BigNumber } = require('ethers');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

/**
 * @dev Gets your public key and its coordinates
 * from your private key 
 */
async function getPublicKey() {
  const privateKey = '0x...';
  const wallet = new ethers.Wallet(privateKey);

  const publicKey = {
    x: ethers.utils.hexDataSlice(wallet.publicKey, 1, 33),
    y: ethers.utils.hexDataSlice(wallet.publicKey, 33)
  }

  console.log("Public Key Info:");
  console.log("Address = ", wallet.address);
  console.log("Public Key = ", wallet.publicKey);
  console.log("PublicKeyX = ", publicKey.x);
  console.log("PublicKeyY = ", publicKey.y);
}
getPublicKey();

/**
 * @dev Gets your stealth private key
 * from your private key and publishedData
 * more info: https://vitalik.ca/general/2023/01/20/stealth.html
 */
async function getStealthPrivateKey() {
  const privateKey = '0x...';
  const publishedData = '0x...';

  // Biggest number allowed
  // https://ethereum.stackexchange.com/questions/10055/is-each-ethereum-address-shared-by-theoretically-2-96-private-keys
  const modulo = BigNumber.from('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

  // Remove "0x" prefix for elliptic library  
  const publishedDataX = publishedData.slice(2,66);
  const publishedDataY = publishedData.slice(66);
  const publishedDataPoint = ec.curve.point(publishedDataX, publishedDataY);

  const sharedSecretPoint = publishedDataPoint.mul(privateKey.slice(2));
  const sharedSecretX = '0x' + sharedSecretPoint.x.toString('hex');
  const sharedSecretY = '0x' + sharedSecretPoint.y.toString('hex');
  const sharedSecretToNumber = ethers.utils.solidityKeccak256(
    ['uint256', 'uint256'],
    [ sharedSecretX, sharedSecretY ]
  );

  const sharedSecretBigInt = BigNumber.from(sharedSecretToNumber);
  const privateKeyBigInt = BigNumber.from(privateKey);
  const stealthPrivateKey = (privateKeyBigInt.add(sharedSecretBigInt)).mod(modulo); // can overflow uint256
  const stealthPrivateKeyHex = stealthPrivateKey.toHexString();
  const wallet = new ethers.Wallet(stealthPrivateKeyHex);
  console.log("\nStealth Address Info:");
  console.log("Stealth Address = ", wallet.address);
  console.log("Stealth Private Key = ", stealthPrivateKeyHex);
}
getStealthPrivateKey();

