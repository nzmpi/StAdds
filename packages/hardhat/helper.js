const { ethers } = require('hardhat');
const { BigNumber } = require('ethers');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

/**
 * @dev Gets a public key and its coordinates
 * from a private key 
 */
async function getPublicKey() {
  const privateKey = '0x6fecf935683b3ada6c7708e6957e28a0e347ea9980ebf026c1e78d16e3b840c6';
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
 * @dev Gets a stealth private key
 * from a private key and publishedData
 * more info: https://vitalik.ca/general/2023/01/20/stealth.html
 */
async function getStealthPrivateKey() {
  const privateKey = '0x503f38a9c967ed597e47fe25643985f032b072db8075426a92110f82df48dfcb';
  const publishedData = '0x6fd74ff8b3f18b12cf2533986a7c88c03fd6e34212a12ac72a213be579f50f0893d28643298ab932309f9149d5b040ec4a2ab5f76edc7d434152cc828a4da4c4';

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

  const x = ethers.utils.solidityKeccak256(
    ['uint256', 'uint256'],
    [ '42', '69' ]
  );
  console.log("x = ", x);
  console.log("y = ", publishedDataY);
}

getStealthPrivateKey();

/*async function getStealthPrivateKey() {
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbfd5efcae784d7bf4f2ff81';
  const publishedData = '0x092ac87ffa9f2db88e0ac1d9328cd848e7b5df39fd6d4a18cb6930373acca63efd6aa26b899ff56a7c7a411765778631da772f06fd5c4c8b04e6244a0f8cf3a6';

  // Biggest number allowed
  // https://ethereum.stackexchange.com/questions/10055/is-each-ethereum-address-shared-by-theoretically-2-96-private-keys
  const modulo = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

  // Remove "0x" prefix for elliptic library  
  const publishedDataX = publishedData.slice(2,66);
  const publishedDataY = publishedData.slice(66);
  const publishedDataPoint = ec.curve.point(publishedDataX, publishedDataY);

  const sharedSecretPoint = publishedDataPoint.mul(privateKey.slice(2));
  const sharedSecretX = ethers.toBeHex(sharedSecretPoint.getX().toString());
  const sharedSecretY = ethers.toBeHex(sharedSecretPoint.getY().toString());
  const sharedSecretToNumber = ethers.solidityPackedKeccak256(
    ['uint256', 'uint256'],
    [ sharedSecretX, sharedSecretY ]
  );

  const sharedSecretBigInt = BigInt(sharedSecretToNumber);
  const privateKeyBigInt = BigInt(privateKey);
  const tempStealthPrivateKey = privateKeyBigInt.add(sharedSecretBigInt); // can overflow uint256
  const stealthPrivateKey = tempStealthPrivateKey.mod(modulo);
  const stealthPrivateKeyHex = ethers.toBeHex(stealthPrivateKey);
  const wallet = new ethers.Wallet(stealthPrivateKeyHex);
  console.log("\nStealth Address Info:");
  console.log("Stealth Address = ", wallet.address);
  console.log("Stealth Private Key = ", stealthPrivateKeyHex);
}*/

