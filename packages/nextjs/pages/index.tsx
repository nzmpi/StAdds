import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";
import React,{ useState, useEffect } from "react";
import { ethers } from "ethers"; // v6
import { AddressInput, Address } from "~~/components/scaffold-eth";
import { 
  useScaffoldContractRead,
  useScaffoldContractWrite
} from "~~/hooks/scaffold-eth";
import { 
  CheckCircleIcon, 
  DocumentDuplicateIcon, 
  InformationCircleIcon 
} from "@heroicons/react/24/outline";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Spinner } from "~~/components/Spinner";
import { useAccount } from 'wagmi';
import Countdown from "react-countdown";
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const Home: NextPage = () => {
  const [addressTo, setAddressTo] = useState("");
  const [publicKeyCopied, setPublicKeyCopied] = useState(false);
  const [sharedSecretCopied, setSharedSecretCopied] = useState(false);
  const [publicKeyLong, setPublicKeyLong] = useState("");
  const [publicKeySource, setPublicKeySource] = useState("");
  const [networkSource, setNetworkSource] = useState("");
  const [secret, setSecret] = useState("");
  const [stealthAddress, setStealthAddress] = useState("");
  const [sharedSecret, setSharedSecret] = useState("");
  const [sharedSecretExists, setSharedSecretExists] = useState(true);
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  // avoiding Error: Hydration failed
  const [isConnected_, setIsConnected_] = useState(false);
  const [errorCustom, setErrorCustom] = useState("");
  const [gettingPublicKey, setGettingPublicKey] = useState(false);
  const {address: signer, isConnected} = useAccount();

  const networks = ["mainnet", "goerli", "sepolia", "matic", "matic-mumbai", "optimism", "optimism-goerli", "arbitrum", "arbitrum-goerli"];
  const baseUrls = new Map([
    ["mainnet", "https://api.etherscan.io/api"],
    ["goerli", "https://api-goerli.etherscan.io/api"],
    ["sepolia", "https://api-sepolia.etherscan.io/api"],
    ["matic", "https://api.polygonscan.com/api"],
    ["matic-mumbai", "https://api-testnet.polygonscan.com/api"],
    ["optimism", "https://api-optimistic.etherscan.io/api"],
    ["optimism-goerli", "https://api-goerli-optimistic.etherscan.io/api"],
    ["arbitrum", "https://api.arbiscan.io/api"],
    ["arbitrum-goerli", "https://api-goerli.arbiscan.io/api"],
  ]);

  // Generator point
  const ecG = ec.curve.point(
    '79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798', 
    '483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8'
  );

  const { data: PublicKey } = useScaffoldContractRead({
    contractName: "StAdds",
    functionName: "getPublicKey",
    args: [addressTo],
  });

  const { data: SharedSecrets } = useScaffoldContractRead({
    contractName: "StAdds",
    functionName: "getSharedSecrets",
    args: [addressTo],
  }); 

  const { data: Timestamp } = useScaffoldContractRead({
    contractName: "StAdds",
    functionName: "getTimestamp",
    args: [signer],
  });

  const { 
    writeAsync: addSharedSecret, 
    isLoading: addSharedSecretLoading 
  } = useScaffoldContractWrite({
    contractName: "StAdds",
    functionName: "addSharedSecret",
    args: [
      addressTo, 
      `0x${sharedSecret.slice(2,66)}`, 
      `0x${sharedSecret.slice(66)}`],
  });

  const getShortPublicKey = () => {
    if (!publicKeyLong) return publicKeyLong;
    return publicKeyLong.slice(0, 16) + "..." + publicKeyLong.slice(-15);
  }

  const getShortSharedSecret = () => {
    if (sharedSecret === "") return "";
    return sharedSecret.slice(0, 15) + "..." + sharedSecret.slice(-14);
  }

  const getNetworkName = (network: string) => {
    if (network === "mainnet") return "Mainnet";
    if (network === "goerli") return "Goerli";
    if (network === "sepolia") return "Sepolia";
    if (network === "matic") return "Polygon";
    if (network === "matic-mumbai") return "Polygon Mumbai";
    if (network === "optimism") return "Optimism";
    if (network === "optimism-goerli") return "Optimism Goerli";
    if (network === "arbitrum") return "Arbitrum";
    if (network === "arbitrum-goerli") return "Arbitrum Goerli";
  }

  const doesSharedSecretExist = () => {
    if (!SharedSecrets) return true;
    if (SharedSecrets.length === 0) return false;
    
    const ShSX = sharedSecret.slice(2,66);
    const ShSY = sharedSecret.slice(66);
    for (let i = 0; i < SharedSecrets.length; i++) {
      if (
        SharedSecrets[i].x.slice(2) === ShSX &&
        SharedSecrets[i].y.slice(2) === ShSY
      ) return true;
    }
    return false;
  }

  const isPublicKeyZero = (pubKey: any) => {
    if (
      pubKey.x === ethers.ZeroHash &&
      pubKey.y === ethers.ZeroHash
    ) return true;
    return false;
  }

  const getApiKey = (network: string) => {
    switch (network) {
      case "mainnet": return process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
      case "goerli": return process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
      case "sepolia": return process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
      case "matic": return process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY;
      case "matic-mumbai": return process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY;
      case "optimism": return process.env.NEXT_PUBLIC_OPTIMISTICSCAN_API_KEY;
      case "optimism-goerli": return process.env.NEXT_PUBLIC_OPTIMISTICSCAN_API_KEY;
      case "arbitrum": return process.env.NEXT_PUBLIC_ARBISCAN_API_KEY;
      case "arbitrum-goerli": return process.env.NEXT_PUBLIC_ARBISCAN_API_KEY;
    }
  }

  const cleanEverything = () => {
    setErrorCustom("");
    setPublicKeyLong("");
    setPublicKeySource("");
    setNetworkSource("");
    setStealthAddress("");
    setSecret("");
    setSharedSecret("");
  }

  async function getPublicKey() {
    for (let i = 0 ; i < networks.length; ++i) {
      const network = networks[i];
      const baseUrl = baseUrls.get(network);
      const SCAN_API_KEY = getApiKey(network);      
      const url = `${baseUrl}?module=account&action=txlist&address=${addressTo}&startblock=0&endblock=99999999&page=1&offset=1&sort=desc&apikey=${SCAN_API_KEY}`;
      const res = await fetch(url);
      const jsonData = await res.json();

      let txHash;
      if (jsonData.message !== "OK") {
        setErrorCustom("No transactions found!");
        continue;
      } else {
        setErrorCustom("");
        txHash = jsonData.result[0].hash;
      }

      const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY;
      const infuraProvider = new ethers.InfuraProvider(
        network,
        INFURA_API_KEY,
      );

      const tx = await infuraProvider.getTransaction(txHash);

      const unsignedTx = {
        gasLimit: tx?.gasLimit,
        value: tx?.value,
        nonce: tx?.nonce,
        data: tx?.data,
        chainId: tx?.chainId,
        to: tx?.to,
        type: tx?.type,
        maxFeePerGas: tx?.maxFeePerGas,
        maxPriorityFeePerGas: tx?.maxPriorityFeePerGas,
      };

      const signature = tx?.signature;
      if (!signature) {
        continue;
      }
      const serializedTx = ethers.Transaction.from(unsignedTx).unsignedSerialized;
      const PK = ethers.SigningKey.recoverPublicKey(
        ethers.keccak256(serializedTx),
        signature
      );

      const address = ethers.getAddress('0x' + ethers.keccak256('0x' + PK.slice(4)).slice(-40));
      if (address !== addressTo) {
        setErrorCustom("Something wrong with the Public Key!");
        continue;
      } else {
        setPublicKeyLong(PK);
        setNetworkSource(network);
        setErrorCustom("");
        setPublicKeySource("Infura");
        setGettingPublicKey(false);
        break;
      }
    }      
    setGettingPublicKey(false);
  }

  const getStealthAddress = () => {
    if (secret === "") {
      setStealthAddress("");
      setSharedSecret("");
      return;
    }

    const secretToNumber = ethers.keccak256(ethers.toUtf8Bytes(secret));
    // Remove "0x" prefix for elliptic library
    const publicKeyX = publicKeyLong.slice(4,68);
    const publicKeyY = publicKeyLong.slice(68);
    const publicKey = ec.curve.point(publicKeyX, publicKeyY);

    const sharedSecretPoint = publicKey.mul(secretToNumber.slice(2));
    const sharedSecretX = ethers.toBeHex(sharedSecretPoint.x.toString());
    const sharedSecretY = ethers.toBeHex(sharedSecretPoint.y.toString());
    const sharedSecretToNumber = ethers.solidityPackedKeccak256(
      ['uint256', 'uint256'],
      [ sharedSecretX, sharedSecretY ]
    );
    const sharedSecretGPoint = ecG.mul(sharedSecretToNumber.slice(2));

    const stealthPublicKey = publicKey.add(sharedSecretGPoint);
    const stealthPublicX = ethers.toBeHex(stealthPublicKey.x.toString());
    const stealthPublicY = ethers.toBeHex(stealthPublicKey.y.toString());
    const stealthPublicKeyToNumber = ethers.solidityPackedKeccak256(
      ['uint256', 'uint256'],
      [ stealthPublicX, stealthPublicY ]
    );

    const newStealthAddress = ethers.getAddress('0x' + stealthPublicKeyToNumber.slice(-40));
    setStealthAddress(newStealthAddress);

    const sharedSecret_ = ecG.mul(secretToNumber.slice(2));
    const sharedSecret_X = ethers.toBeHex(sharedSecret_.x.toString());
    const sharedSecret_Y = ethers.toBeHex(sharedSecret_.y.toString());
    setSharedSecret(sharedSecret_X + sharedSecret_Y.slice(2));
  }

  useEffect(() => {
    cleanEverything();
    setGettingPublicKey(true);
    if (!ethers.isAddress(addressTo)) {
      setGettingPublicKey(false);
      return;
    } else if (PublicKey && !isPublicKeyZero(PublicKey)) {
      setPublicKeyLong('0x04' + PublicKey.x.slice(2) + PublicKey.y.slice(2));
      setPublicKeySource("Contract");
      setGettingPublicKey(false);
      return;
    } else {
      getPublicKey();
    }
  }, [addressTo]);

  useEffect(() => {
    getStealthAddress();
  }, [secret]);

  useEffect(() => {
    setSharedSecretExists(doesSharedSecretExist());
  }, [SharedSecrets, addSharedSecretLoading, sharedSecret]);

  useEffect(() => {
    if (!Timestamp || Timestamp < Date.now()/1000) {
      setIsOnCooldown(false);
      return;
    }
    if (Timestamp > Date.now()/1000) setIsOnCooldown(true);
  }, [Timestamp]);

  useEffect(() => {
    cleanEverything();
    setIsConnected_(isConnected);
  }, [isConnected]);

  const Completionist = () => {
    setIsOnCooldown(false);
    return <span></span>;
  };
  const CountdownWrapper = () => 
  <Countdown date={Number(Timestamp || 0)*1000}>
    <Completionist/>
  </Countdown>;
  const MemoCountdown = React.memo(CountdownWrapper);

  return (
    <>
      <MetaHeader/>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div>
        <span className="text-[3rem] text-center h-16 md:h-20 text-pink-700">
          St
        </span>
        <span className="text-[3rem] text-center h-16 md:h-20">
          ealth {" "}
        </span>
        <span className="text-[3rem] text-center h-16 md:h-20 text-pink-700">
          Add
        </span>
        <span className="text-[3rem] text-center h-16 md:h-20">
          resse
        </span>
        <span className="text-[3rem] text-center h-16 md:h-20 text-pink-700">
          s
        </span>
      </div>
      <div className="mx-auto mt-7">        
        <form className="w-[400px] bg-base-100 rounded-3xl shadow-xl border-pink-700 border-2 p-2 px-7 py-5 flex justify-center">
        <div className="flex-column">
        <div className="flex flex-row">
          <span className="text-3xl">
            Create a Stealth Address
          </span>     
        </div>
          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text font-bold">
                Receiver:
              </span>
            </label>
            <AddressInput placeholder="Address" value={addressTo} 
              onChange={value => {
                if (value === "") {
                  setAddressTo("");
                } else if (ethers.isAddress(value)) {
                  setAddressTo(ethers.getAddress(value));
                } else {
                  setAddressTo(value);
                }                  
              }}
            />              
          </div>
          {!ethers.isAddress(addressTo) && addressTo !== "" && (
            <span className="ml-2 text-[0.95rem] text-red-500">
              Not an address!
            </span>
          )}

          {gettingPublicKey && (
          <div className="flex justify-center mt-5">
            <Spinner/>
          </div>
          )}

          {addressTo === ""  
          }

          {addressTo !== "" &&
           !gettingPublicKey &&
           publicKeySource === "Contract" &&
          (
          <div>
          <div className="form-control mb-3">
          <label className="label">
            <span className="label-text font-bold">
              We have {addressTo === signer ? "your" : "their"} Public Key: 
            </span>
          </label>
          <div className="flex flex-row mx-2">
            {getShortPublicKey()}
            
            {publicKeyCopied ? (
            <CheckCircleIcon
              className="ml-1.5 text-xl font-normal text-orange-600 h-5 w-5 cursor-pointer"
              aria-hidden="true"
            />
            ) : (
            <CopyToClipboard
              text={publicKeyLong}
              onCopy={() => {
                setPublicKeyCopied(true);
              setTimeout(() => {
                setPublicKeyCopied(false);
              }, 800);
              }}
            >
            <DocumentDuplicateIcon
              className="text-xl font-normal text-orange-600 h-5 w-5 cursor-pointer mx-2"
            />
            </CopyToClipboard>
            )}
          </div>
          </div>
          </div>
          )}

          {addressTo !== "" &&
           !gettingPublicKey &&
           publicKeySource === "Infura" &&
          (
          <div>
          <div className="form-control mb-3">
          <label className="label">
            <span className="label-text font-bold">
              We don't have {addressTo === signer ? "your" : "their"} Public Key, but we retrieved it from {getNetworkName(networkSource)}:
            </span>
          </label>
          <div className="flex flex-row mx-2">
            {getShortPublicKey()}
            
            {publicKeyCopied ? (
            <CheckCircleIcon
              className="ml-1.5 text-xl font-normal text-orange-600 h-5 w-5 cursor-pointer"
              aria-hidden="true"
            />
            ) : (
            <CopyToClipboard
              text={publicKeyLong}
              onCopy={() => {
                setPublicKeyCopied(true);
              setTimeout(() => {
                setPublicKeyCopied(false);
              }, 800);
              }}
            >
            <DocumentDuplicateIcon
              className="text-xl font-normal text-orange-600 h-5 w-5 cursor-pointer mx-2"
            />
            </CopyToClipboard>
            )}
          </div>
          </div>
          </div>
          )}

          {addressTo !== "" &&
           !gettingPublicKey &&
           errorCustom === "No transactions found!" &&
          (
          <div>
          <div className="form-control mb-3">
          <label className="label">
            <span className="label-text font-bold">
              We don't have {addressTo === signer ? "your" : "their"} Public Key and this address has no transactions on any of this chains:
            </span>
          </label>
          {networks.map((arr) => (
            <div className="flex justify-center">
              {getNetworkName(arr)}
            </div>
          ))}
          </div>
          </div>
          )}

          {addressTo !== "" &&
           !gettingPublicKey &&
           errorCustom === "Something wrong with the Public Key!" &&
          (
          <div>
          <div className="form-control mb-3">
          <label className="label">
            <span className="label-text font-bold">
              There is something wrong with {addressTo === signer ? "your" : "their"} Public Key!
            </span>
          </label>
          </div>
          </div>
          )}

          {publicKeyLong &&         
          (                   
          <div className="form-control mb-3">
          <div className="flex flex-row">
          <div 
            className="tooltip tooltip-secondary mt-2"
            data-tip="Your secret is used as a salt">
            <InformationCircleIcon className="h-5 w-5 mt-0.5" />
          </div>
          <label className="label">
            <span className="label-text font-bold">
              Enter Your Secret:
            </span>
          </label>
            
          </div>
          <textarea
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="Secret"
            rows={2}
            className="mt-1 input-md border-2 bg-base-200 border-orange-400 rounded-3xl px-4 py-1.5 focus:outline-none focus:text-gray-600 placeholder:text-grey-400 text-gray-400"
          />
          </div>
          )}

          {stealthAddress && 
          (
          <div>
          <div className="form-control mb-3">
          <div className="flex flex-row">
          <div 
            className="tooltip tooltip-secondary mt-2"
            data-tip="Send some MATIC to this address!">
            <InformationCircleIcon className="h-5 w-5 mt-0.5" />
          </div>
          <label className="label">
            <span className="label-text font-bold">
              {addressTo === signer ? "Your" : "Their"} Stealth Address:
            </span>          
          </label>
          </div>
          <div>
            <div className="mx-3 mt-1">
              <Address address={stealthAddress}/>
            </div>
          </div>
          </div>

          <div className="form-control mb-3">
          <label className="label">
            <span className="label-text font-bold">
              {addressTo === signer ? "Your" : "Their"} Shared Secret:
            </span>
          </label>
          <div className="flex flex-row mx-3">
            {getShortSharedSecret()}
            
            {sharedSecretCopied ? (
            <CheckCircleIcon
              className="ml-1.5 text-xl font-normal text-orange-600 h-5 w-5 cursor-pointer"
              aria-hidden="true"
            />
            ) : (
            <CopyToClipboard
              text={sharedSecret}
              onCopy={() => {
                setSharedSecretCopied(true);
              setTimeout(() => {
                setSharedSecretCopied(false);
              }, 800);
              }}
            >
            <DocumentDuplicateIcon
              className="text-xl font-normal text-orange-600 h-5 w-5 cursor-pointer mx-2"
            />
            </CopyToClipboard>
            )}
          </div>
          </div>
          
          {!isOnCooldown && 
           isConnected_ &&
          (                  
          <div className="mt-3 flex flex-col items-center py-2">
            <button
              type="button"
              disabled={sharedSecretExists}              
              onClick={async () => {await addSharedSecret();}}
              className={"btn btn-warning font-black w-1/3 flex items-center"}
            >              
            {addSharedSecretLoading && (
            <>
              <Spinner/>
            </>
            )}
            {!addSharedSecretLoading && 
             !sharedSecretExists &&
            (
            <>
              save
            </>
            )}
            {!addSharedSecretLoading && 
             sharedSecretExists &&
            (
            <>
              exists
            </>
            )} 
            </button>
          </div>
          )}

          {isOnCooldown &&
          (                  
          <div className="flex flex-row items-center card-body p-2 pb-2 mx-8">
            <span className="label-text font-bold">             
              You are on cooldown: 
            </span>
            <MemoCountdown/>
          </div>
          )}
          
          </div>            
          )}

        </div>
        </form>
      </div>
      </div>
    </>
  );
};

export default Home;
