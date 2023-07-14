const { ethers } = require('hardhat');
const { BigNumber } = require('ethers');

const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

/**
 * @dev Gets a public key and its coordinates
 * from a private key 
 */
async function getPublicKey() {
  //const privateKey = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
  const privateKey = '0x503f38a9c967ed597e47fe25643985f032b072db8075426a92110f82df48dfcb';
  //const provider = ethers.getDefaultProvider('homestead');
  const wallet = new ethers.Wallet(privateKey);

  const publicKey = {
    x: ethers.utils.hexDataSlice(wallet.publicKey, 1, 33),
    y: ethers.utils.hexDataSlice(wallet.publicKey, 33)
  }

  console.log("getPublicKey:");
  console.log("wallet = ", wallet.address);
  console.log("public key = ", wallet.publicKey);
  console.log("publicKeyX = ", publicKey.x);
  console.log("publicKeyY = ", publicKey.y);
}

getPublicKey();

/**
 * @dev Gets a stealth private key
 * from a private key and publishedData
 * more info: https://vitalik.ca/general/2023/01/20/stealth.html
 */
/*async function getStealthPrivateKey() {
  const privateKey = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
  const publishedDataX = '0xab16b8c7fc1febb74ceedf1349944ffd4a04d11802451d02e808f08cb3b0c1c1';
  const publishedDataY = '0xa9c4e1efb7d309a762baa4c9c8da08890b3b712d1666b5b630d6c6a09cbba171';

  // Biggest number allowed
  // https://ethereum.stackexchange.com/questions/10055/is-each-ethereum-address-shared-by-theoretically-2-96-private-keys
  const modulo = BigNumber.from('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

  // Remove "0x" prefix for elliptic library  
  const publishedDataXString = publishedDataX.slice(2);
  const publishedDataYString = publishedDataY.slice(2);
  const publishedData = ec.curve.point(publishedDataXString, publishedDataYString);

  const privateKeyString = privateKey.slice(2);
  const sharedSecret = publishedData.mul(privateKeyString);
  const sharedSecretX = '0x' + sharedSecret.x.toString('hex');
  const sharedSecretY = '0x' + sharedSecret.y.toString('hex');

  const sharedSecretHashed = ethers.utils.solidityKeccak256(
    ['uint256', 'uint256'],
    [ sharedSecretX, sharedSecretY ]
  );

  const SSH = BigNumber.from(sharedSecretHashed);
  const PK = BigNumber.from(privateKey);
  const firstPK = PK.add(SSH); // can overflow uint256
  const rightPK = firstPK.mod(modulo);
  const PKHex = rightPK.toHexString();
  const wallet = new ethers.Wallet(PKHex);
  console.log("\ngetStealthPrivateKey:");
  console.log("stealth wallet = ", wallet.address);
  console.log("stealth private key = ", PKHex);
}

getStealthPrivateKey();*/