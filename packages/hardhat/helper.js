const { ethers } = require('hardhat'); // v5
const { BigNumber } = require('ethers');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

/**
 * @notice Gets your public key and its coordinates
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
 * @notice Gets your stealth private key
 * from your private key and publishedData
 * more info: https://vitalik.ca/general/2023/01/20/stealth.html
 */
async function getStealthPrivateKey() {
  const privateKey = '0x...';
  const sharedSecret = '0x...';

  // Biggest number allowed
  // https://ethereum.stackexchange.com/questions/10055/is-each-ethereum-address-shared-by-theoretically-2-96-private-keys
  const modulo = BigNumber.from('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

  // Remove "0x" prefix for elliptic library  
  let sharedSecretPointX = sharedSecret.slice(2,66);
  let sharedSecretPointY = sharedSecret.slice(66);
  let sharedSecretPoint = ec.curve.point(sharedSecretPointX, sharedSecretPointY);

  sharedSecretPoint = sharedSecretPoint.mul(privateKey.slice(2));
  sharedSecretPointX = '0x' + sharedSecretPoint.x.toString('hex');
  sharedSecretPointY = '0x' + sharedSecretPoint.y.toString('hex');
  const sharedSecretPointToNumber = ethers.utils.solidityKeccak256(
    ['uint256', 'uint256'],
    [ sharedSecretPointX, sharedSecretPointY ]
  );

  const sharedSecretBigInt = BigNumber.from(sharedSecretPointToNumber);
  const privateKeyBigInt = BigNumber.from(privateKey);
  const stealthPrivateKey = (privateKeyBigInt.add(sharedSecretBigInt)).mod(modulo); // can overflow uint256
  const stealthPrivateKeyHex = stealthPrivateKey.toHexString();
  const wallet = new ethers.Wallet(stealthPrivateKeyHex);
  console.log("\nStealth Address Info:");
  console.log("Stealth Address = ", wallet.address);
  console.log("Stealth Private Key = ", stealthPrivateKeyHex);
}
getStealthPrivateKey();

