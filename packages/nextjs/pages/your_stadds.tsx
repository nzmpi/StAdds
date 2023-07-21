import Link from "next/link";
import type { NextPage } from "next";
import React,{ useState, useEffect } from "react";
import { MetaHeader } from "~~/components/MetaHeader";
import { 
  useScaffoldContractRead,
  useScaffoldContractWrite,
  useScaffoldEventSubscriber
} from "~~/hooks/scaffold-eth";
import { ethers } from "ethers"; // v6
import { useAccount } from 'wagmi';
import { AddressInput, Address, InputBase } from "~~/components/scaffold-eth";
import { CheckCircleIcon, DocumentDuplicateIcon, TrashIcon } from "@heroicons/react/24/outline";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Spinner } from "~~/components/Spinner";
import * as dotenv from "dotenv";
dotenv.config();
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const Your_StAdds: NextPage = () => {
  const [stealthAddress, setStealthAddress] = useState("");
  const [stealthPrivateKey, setStealthPrivateKey] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [publicKeyLong, setPublicKeyLong] = useState("");
  const [publicKeySource, setPublicKeySource] = useState("");
  const [networkSource, setNetworkSource] = useState("");
  const [userPublicKey, setUserPublicKey] = useState("");
  const [userPrivateKey, setUserPrivateKey] = useState("");
  const [publishedData, setPublishedData] = useState("");
  const [publishedDataCopied, setPublishedDataCopied] = useState<boolean[]>();
  const [stealthPrivateKeyCopied, setStealthPrivateKeyCopied] = useState(false);const [indexToRemove, setIndexToRemove] = useState(-1);
  // avoiding Error: Hydration failed
  const [isConnected_, setIsConnected_] = useState(false);
  const [publicKeyCopied, setPublicKeyCopied] = useState(false); 
  const [gettingPublicKey, setGettingPublicKey] = useState(false); 
  const [errorCustom, setErrorCustom] = useState("");
  const [errorPK, setErrorPK] = useState("");
  const [errorPD, setErrorPD] = useState("");
  const [errorPrK, setErrorPrK] = useState("");
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
  const {address: signer, isConnected} = useAccount();

  const [test, setTest] = useState<any>();
 
  const { data: PublicKey } = useScaffoldContractRead({
    contractName: "StAdds",
    functionName: "getPublicKey",
    args: [userAddress],
  });

  const { data: PublishedData } = useScaffoldContractRead({
    contractName: "StAdds",
    functionName: "getPublishedData",
    args: [signer],
  });

  const { 
    writeAsync: addPublicKey, 
    isLoading: addPublicKeyLoading 
  } = useScaffoldContractWrite({
    contractName: "StAdds",
    functionName: "addPublicKey",
    args: [
      `0x${publicKeyLong.slice(4, 68)}`, 
      `0x${publicKeyLong.slice(-64)}`
    ],});

  const { 
    writeAsync: addUserPublicKey, 
    isLoading: addUserPublicKeyLoading 
  } = useScaffoldContractWrite({
    contractName: "StAdds",
    functionName: "addPublicKey",
    args: [
      `0x${userPublicKey.slice(4, 68)}`, 
      `0x${userPublicKey.slice(-64)}`
    ],});

  const { 
    writeAsync: removePublicKey, 
    isLoading: removePublicKeyLoading 
  } = useScaffoldContractWrite({
    contractName: "StAdds",
    functionName: "removePublicKey",
  });

  const { 
    writeAsync: removePublishedData, 
    isLoading: removePublishedDataLoading 
  } = useScaffoldContractWrite({
    contractName: "StAdds",
    functionName: "removePublishedData",
    args: [BigInt(indexToRemove)],
  });

  const getShortPublicKey = (PK: any) => {
    if (!PK) return "";
    return PK.slice(0, 16) + "..." + PK.slice(-14);
  }

  const getShortPublishedData = (PD: string) => {
    if (PD === "") return "";
    return PD.slice(0, 10) + "..." + PD.slice(-11);
  }

  const getShortPrivateKey = (PrK: string) => {
    if (PrK === "") return "";
    return PrK.slice(0, 10) + "..." + PrK.slice(-11);
  }

  const cleanEverything = () => {
    setErrorCustom("");
    setErrorPK("");
    setUserPublicKey("");
    setPublicKeyLong("");
    setPublicKeySource("");
    setNetworkSource("");
  }

  const getFullPublicKey = (PK: any) => {
    if (
      !PK || 
      (PK.x === ethers.ZeroHash &&
       PK.y === ethers.ZeroHash)
    ) return "";
    return PK.x.slice(0, 68) + PK.y.slice(-64);
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

  const getAddressFromPK = (PK: string) => {
    return ethers.getAddress('0x' + ethers.keccak256('0x' + PK.slice(4)).slice(-40));
  }
  
  async function getPubKey() {
    for (let i = 0 ; i < networks.length; ++i) {
      const network = networks[i];
      const baseUrl = baseUrls.get(network);
      const SCAN_API_KEY = getApiKey(network);      
      const url = `${baseUrl}?module=account&action=txlist&address=${userAddress}&startblock=0&endblock=99999999&page=1&offset=1&sort=desc&apikey=${SCAN_API_KEY}`;
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
      if (address !== userAddress) {
        setErrorCustom("Something wrong with the Public Key!");
        continue;
      } else {
        setPublicKeyLong(PK);
        setNetworkSource(network);
        setErrorCustom("");
        setPublicKeySource("Infura");        
        break;
      }
    }
    setGettingPublicKey(false);
  }

  const isPublicKeyZero = (pubKey: any) => {
    if (
      !pubKey || 
      (pubKey.x === ethers.ZeroHash &&
       pubKey.y === ethers.ZeroHash)
    ) return true;
    return false;
  }

  async function getStealthPrivateKey(privateKey: string) {  
    // Biggest number allowed
    // https://ethereum.stackexchange.com/questions/10055/is-each-ethereum-address-shared-by-theoretically-2-96-private-keys
    const modulo = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
  
    // Remove "0x" prefix for elliptic library  
    const publishedDataX = publishedData.slice(2,66);
    const publishedDataY = publishedData.slice(66);
    const publishedDataPoint = ec.curve.point(publishedDataX, publishedDataY);
  
    const sharedSecretPoint = publishedDataPoint.mul(privateKey.slice(2));
    const sharedSecretX = '0x' + sharedSecretPoint.x.toString('hex');
    const sharedSecretY = '0x' + sharedSecretPoint.y.toString('hex');
    const sharedSecretToNumber = ethers.solidityPackedKeccak256(
      ['uint256', 'uint256'],
      [ sharedSecretX, sharedSecretY ]
    );
  
    const sharedSecretBigInt = BigInt(sharedSecretToNumber);
    const privateKeyBigInt = BigInt(privateKey);
    const stealthPrivateKey = (privateKeyBigInt + sharedSecretBigInt) % modulo; // can overflow uint256
    const stealthPrivateKeyHex = '0x' + stealthPrivateKey.toString(16);
    setStealthPrivateKey(stealthPrivateKeyHex);
    const wallet = new ethers.Wallet(stealthPrivateKeyHex);
    setStealthAddress(wallet.address);
  }

  const handleOnCheck = () => {
    setUserAddress(signer ? signer : "");
    setGettingPublicKey(true);
  }

  useEffect(() => {
    cleanEverything();
    setGettingPublicKey(true);
    if (userAddress === "") {
      setGettingPublicKey(false);
      return;
    } else if (PublicKey && !isPublicKeyZero(PublicKey)) {        
      setPublicKeyLong('0x04' + PublicKey.x.slice(2) + PublicKey.y.slice(2));
      setPublicKeySource("Contract"); 
      setGettingPublicKey(false);
      return;
    } else {
      getPubKey();
    }
  }, [userAddress, PublicKey]);

  useEffect(() => {
    setErrorPK("");
    if (userPublicKey === "") return;

    if (userPublicKey.length === 132 && userPublicKey.slice(0,4) === "0x04") {
      if (getAddressFromPK(userPublicKey) === signer) {
        setUserPublicKey(userPublicKey);
      } else {
        setErrorPK("Not your Public Key!");
      }      
      return;
    } else if (userPublicKey.length === 130) {
      if (getAddressFromPK('0x04' + userPublicKey.slice(2)) === signer) {
        setUserPublicKey('0x04' + userPublicKey.slice(2));
      } else {
        setErrorPK("Not your Public Key!");
      }      
      return;
    } else {
      setErrorPK("Not a Public Key!");
    }
  }, [userPublicKey]);

  useEffect(() => {
    setIsConnected_(isConnected);
  }, [isConnected]);

  useEffect(() => {
    cleanEverything();
    setUserAddress("");
  }, [signer]);

  useEffect(() => {
    if (!PublishedData) return;
    if (PublishedData.length === 0) return;
    let temp = [];
    for (let i = 0; i < PublishedData.length; ++i) {
      temp.push(false);
    }
    setPublishedDataCopied(temp);
  }, [PublishedData]);

  useEffect(() => {
    setErrorPD("");
    if (publishedData === "" || !PublishedData) return;
    if (
      !(Boolean(publishedData.match(/^0x[a-f0-9]+$/g)) ||
        Boolean(publishedData.match(/^[a-f0-9]+$/g)) ||
        Boolean(publishedData.match(/^[0-9]+$/g)))
    ) {
      setErrorPD("Something wrong with the Published Data!");
      return;
    }
    if (Number(publishedData) < 1) {
      setErrorPD("Something wrong with the Published Data!");
      return;
    }
    if (Number(publishedData) <= PublishedData?.length) {
      if (PublishedData[Number(publishedData)-1].creator === ethers.ZeroAddress) {
        setErrorPD("Something wrong with the Published Data!");
        return;
      }
      const temp = PublishedData[Number(publishedData)-1].x + PublishedData[Number(publishedData)-1].y.slice(2);
      setPublishedData(temp);
    } else {
      if (publishedData.length === 130 && publishedData.slice(0,2) === "0x") {
        return;
      } else if (publishedData.length === 128 && publishedData.slice(0,2) !== "0x") {
        setPublishedData('0x' + publishedData);
      } else {
        setErrorPD("Something wrong with the Published Data!");
        return;
      }
    }
  }, [publishedData]);

  useEffect(() => {
    setErrorPrK("");
    if (userPrivateKey === "") return;
    if (
      !(Boolean(publishedData.match(/^0x[a-f0-9]+$/g)) ||
        Boolean(publishedData.match(/^[a-f0-9]+$/g)))
    ) {
      setErrorPrK("Not a private key!");
      return;
    }
    if (userPrivateKey.length === 66 && userPrivateKey.slice(0,2) === "0x") {
      const wallet = new ethers.Wallet(userPrivateKey);
      if (wallet.address !== signer) {
        setErrorPrK("Not your private key!");
        return;
      } else {
        getStealthPrivateKey(userPrivateKey);
      }
    } else 
      if (userPrivateKey.length === 64 && userPrivateKey.slice(0,2) !== "0x") {
      const wallet = new ethers.Wallet(userPrivateKey);
      if (wallet.address !== signer) {
        setErrorPrK("Not your private key!");
        return;
      } else {
        setUserPrivateKey('0x' + userPrivateKey);
        getStealthPrivateKey('0x' + userPrivateKey);
      }     
    } else {
      setErrorPrK("Not a private key!");
    }    
  }, [userPrivateKey]);

  useEffect(() => {
  }, [addPublicKeyLoading, removePublicKeyLoading, addUserPublicKeyLoading, removePublishedDataLoading]);

  return (
    <>
      <MetaHeader
        title="Your StAdds"
        description="Get your StAdds here!"
      />
      <div>
      {"publicKeyLong: " + publicKeyLong}
      </div>
      <div>
      {" " + (test || "r")}
      </div>
      <div>
      {"stealthAddress: " + stealthAddress}
      </div>
      <div>
      {"stealthPrivateKey: " + stealthPrivateKey}
      </div>
      <div>
      {"Error: " + ('503f38a9c967ed597e47fe25643985f032b072db8075426a92110f82df48dfcb').length }
      </div>

      {isConnected_ &&
      (
      <div className="flex sm:flex-row flex-col">
      <div className="flex items-center flex-col flex-grow pt-8">
      <div className={"mx-auto mt-7"}>
        <form className={"w-[400px] bg-base-100 rounded-3xl shadow-xl border-pink-700 border-2 p-2 px-7 py-5"}>
        <div className="flex-column">

        {gettingPublicKey && (
          <div>
          <span className="text-2xl">
            Checking your Public Key...
          </span>
          <div className="flex justify-center mt-5">
            <Spinner/>
          </div>
          </div>
        )}

        {userAddress === "" && 
         publicKeyLong === "" &&
         errorCustom === "" &&
        (
        <div className="mt-2 px-5">
          <div className="flex justify-center">
          <span className="text-2xl">
            Check your Public Key
          </span>
          </div>
          <div className="mt-4 flex justify-center"> 
          <button
            type="button"             
            onClick={handleOnCheck}
            className={"btn btn-warning font-black w-1/3 flex items-center"}
          > 
          {!gettingPublicKey &&
          (
          <>
            check
          </>
          )}
          {gettingPublicKey &&
          (
          <>
            <Spinner/>
          </>
          )}
          </button>
          </div>
        </div>
        )}

        {publicKeyLong !== "" &&
         !gettingPublicKey &&
         publicKeySource === "Contract" &&
        (
          <div className="mt-2">          
          <span className="text-2xl">We have your Public Key</span>  
          <div className="form-control mb-2 mt-2">
            <div className="flex flex-row">
              <button
                type="button"
                onClick={async () => {await removePublicKey();}}
              >
                <TrashIcon className="h-4"/>
              </button>
              <div className="mx-2">
              {getShortPublicKey(publicKeyLong)}
              </div>
              {publicKeyCopied ? (
              <CheckCircleIcon
                className="ml-1.5 text-xl font-normal text-orange-600 h-5 w-5 cursor-pointer"
                aria-hidden="true"
              />
              ) : (
              <CopyToClipboard
                text={getFullPublicKey(PublicKey)}
                onCopy={() => {
                  setPublicKeyCopied(true);
                setTimeout(() => {
                  setPublicKeyCopied(false);
                }, 800);
                }}
              >
              <DocumentDuplicateIcon
                className="text-xl font-normal text-orange-600 h-5 w-5 cursor-pointer"
              />
              </CopyToClipboard>
              )}
  
            </div>
          </div>
          </div>
        )}

        {publicKeyLong !== "" &&
         !gettingPublicKey &&
         publicKeySource === "Infura" &&
        (
          <div className="mt-2">  
          <div>        
          <span className="text-2xl">
            We don't have your Public Key
          </span>
          </div>
          <div className="mt-2">  
          <span className="text-1xl mx-3">
            But we retrieved it from {getNetworkName(networkSource)}:
          </span>
          </div>
          <div className="form-control mb-2 mt-2">
            <div className="flex flex-row">
              <div className="mx-2">
              {getShortPublicKey(publicKeyLong)}
              </div>
              {publicKeyCopied ? (
              <CheckCircleIcon
                className="ml-1.5 text-xl font-normal text-orange-600 h-5 w-5 cursor-pointer"
                aria-hidden="true"
              />
              ) : (
              <CopyToClipboard
                text={getFullPublicKey(PublicKey)}
                onCopy={() => {
                  setPublicKeyCopied(true);
                setTimeout(() => {
                  setPublicKeyCopied(false);
                }, 800);
                }}
              >
              <DocumentDuplicateIcon
                className="text-xl font-normal text-orange-600 h-5 w-5 cursor-pointer"
              />
              </CopyToClipboard>
              )}
  
            </div>
          </div>

          <div className="mt-4">        
          <span className="text-2xl">
            You can add it to the contract
          </span>
          </div>
          
          <div className="mt-4 flex justify-center"> 
            <button
              type="button"             
              onClick={async () => {await addPublicKey();}}
              className={"btn btn-warning font-black w-1/3 flex items-center"}
            >              
            {addPublicKeyLoading && (
            <>
              <Spinner/>
            </>
            )}
            {!addPublicKeyLoading && 
            (
            <>
              add
            </>
            )} 
            </button>
          </div>
          </div>
        )}

        {publicKeyLong === "" &&
         !gettingPublicKey &&
         errorCustom === "No transactions found!" &&
        (
        <div>
        <div className="form-control mb-3">
        <label className="label">
          <span className="label-text font-bold">
            We don't have your Public Key and this address has no transactions on any of this chains:
          </span>
        </label>
        {networks.map((arr) => (
          <div className="flex justify-center">
            {getNetworkName(arr)}
          </div>
        ))}
        <label className="label mt-5">
          <span className="label-text font-bold">
            But you can add it yourself:
          </span>
        </label>

        <div className="mt-3">
        <InputBase placeholder="Public Key: 0x04..." value={userPublicKey} 
          onChange={value => {
            if (value === "") {
              setUserPublicKey("");
            } else {
              setUserPublicKey(value);
            }                  
          }}
        />
        </div>

        {userPublicKey !== "" &&
        errorPK === "" && 
        (                
        <div className="mt-4 flex justify-center"> 
          <button
            type="button"             
            onClick={async () => {await addUserPublicKey();}}
            className={"btn btn-warning font-black w-1/3 flex items-center"}
          >              
          {addUserPublicKeyLoading && (
          <>
            <Spinner/>
          </>
          )}
          {!addUserPublicKeyLoading && 
          (
          <>
            add
          </>
          )} 
          </button>
        </div>
        )}

        {userPublicKey !== "" &&
         errorPK === "Not your Public Key!" && 
        (     
        <div className="flex justify-center">           
        <label className="label mt-5">
          <span className="label-text font-bold text-red-500">
            Not your Public Key!
          </span>
        </label>
        </div>
        )}

        {userPublicKey !== "" &&
         errorPK === "Not a Public Key!" && 
        (           
        <div className="flex justify-center">     
        <label className="label mt-5">
          <span className="label-text font-bold text-red-500">
            Not a Public Key!
          </span>
        </label>
        </div>
        )}

        {userPublicKey === "" &&
        (
        <label className="label mt-5">
          <span className="label-text font-bold">
            You can use{" "}
            <Link href="https://github.com/nzmpi/StAdds/blob/main/packages/nextjs/helper.js#L11" passHref className="link">
              this
            </Link>{" "}helper function to get your Public Key from your private key
          </span>
        </label>
        )}
        

        </div>
        </div>
        )}

        </div>
        </form>
      </div>
      </div>

      <div className="flex items-center flex-col flex-grow pt-8">
      <div className={"mx-auto mt-7"}>
      <form className={"w-[400px] bg-base-100 rounded-3xl shadow-xl border-pink-700 border-2 p-2 px-7 py-5"}>
      <div className="flex-column">
       
      <div className="mt-2 px-4">
        <span className="text-2xl">
          Get your Stealth Private Key
        </span>

        <div className="form-control mb-3">
          <label className="label">
            <span className="label-text font-bold">
             Your Published Data
            </span>
          </label>
          <InputBase placeholder="0x... or index" value={publishedData} 
            onChange={value => {
              if (value === "") {
                setPublishedData("");
              } else {
                setPublishedData(value);
              }                  
            }}
          />
        </div>

        {errorPD !== "" &&
        (
        <span className="ml-2 text-[0.95rem] text-red-500">
          {errorPD}
        </span>
        )}

        {errorPD === "" &&
         publishedData !== "" &&
        (
        <div className="form-control mb-3">
          <label className="label">
            <span className="label-text font-bold">
             Your Private Key
            </span>
          </label>
          <InputBase placeholder="0x..." value={userPrivateKey} 
            onChange={value => {
              if (value === "") {
                setUserPrivateKey("");
              } else {
                setUserPrivateKey(value);
              }                  
            }}
          />

          {userPrivateKey !== "" &&
          errorPrK == "" &&
          (
          <div className="form-control mb-3 mt-3">
          <label className="label">
            <span className="label-text font-bold">
              Your Stealth Address:
            </span>
          </label>
          <div className="mx-3">
            <Address address={stealthAddress}/>
          </div>

          <label className="label mt-3">
            <span className="label-text font-bold">
              Your Stealth Private Key:
            </span>
          </label>
          <div className="mx-3">
            <div className="flex flex-row">
            {getShortPrivateKey(stealthPrivateKey)}

            {stealthPrivateKeyCopied ? (
            <CheckCircleIcon
              className="ml-1.5 text-xl font-normal text-orange-600 h-5 w-5 cursor-pointer"
              aria-hidden="true"
            />
            ) : (
            <CopyToClipboard
              text={stealthPrivateKey}
              onCopy={() => {
                setStealthPrivateKeyCopied(true);
              setTimeout(() => {
                setStealthPrivateKeyCopied(false);
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

          {userPrivateKey === "" &&
          (
          <div>
          <label className="label mt-2">
          <span className="label-text font-bold">
            To get your Stealth Private Key we need your private key.
            If you don't trust this dApp you can:
          </span>
          </label>
          
          
          <label className="label flex flex-col">
          <span className="label-text font-bold">
            1. Turn off your Internet (everything is off-chain)
          </span>
          </label>
          <label className="label">
          <span className="label-text font-bold">
            2. Use{" "}
            <Link href="https://github.com/nzmpi/StAdds/blob/main/packages/nextjs/helper.js#L11" passHref className="link">
              this
            </Link>{" "}helper function
          </span>
          </label>
          </div>
          )}

          {errorPrK === "Not a private key!" &&
          (
          <span className="ml-2 text-[0.95rem] text-red-500 mt-3">
           {errorPrK}
          </span>
          )}

        </div>
        )}

      </div>

      </div>
      </form>
      
      {PublishedData &&
       PublishedData.length > 0 &&
      (        
      <form className={"bg-base-100 rounded-3xl shadow-xl border-pink-700 border-2 p-2 px-7 py-5 mt-10"}>
      <div className="flex-column">       
      <div className="mt-2 px-4">
        <span className="text-2xl">
          All your Published Data
        </span>
      </div>

      {PublishedData.slice().reverse().map((arr, index) => (
      <div>
        {arr.creator !== ethers.ZeroAddress &&
        (
        <div className="form-control mb-3 mt-3">
          <div className="flex">
            {PublishedData.length-index}.{"  "} From 
            <div className="mx-2">
              <Address address={arr.creator}/>
            </div>            
          </div>
          <div className="flex justify-center mt-2">
          
          <button
            type="button"
            onClick={async () => {await removePublishedData();}}
            onMouseEnter={() => {
              setIndexToRemove(PublishedData.length-index-1);
            }}
          >
            <TrashIcon className="h-4"/>
          </button>

          <div className="mx-2">
          Published Data:           
          </div>

          {getShortPublishedData(arr.x + arr.y.slice(2))}

          {publishedDataCopied?.[index] ? (
            <CheckCircleIcon
              className="ml-1.5 text-xl font-normal text-orange-600 h-5 w-5 cursor-pointer"
              aria-hidden="true"
            />
            ) : (
            <CopyToClipboard
              text={arr.x + arr.y.slice(2)}
              onCopy={() => {
                setPublishedDataCopied(prevState => prevState?.map((item, idx) => idx === index ? true : false));
              setTimeout(() => {
                setPublishedDataCopied(prevState => prevState?.map(() => false));
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
        )}
      </div>
      ))}

      </div>
      </form>
      )}


      </div>
      </div>
        


      </div>
      )}

      {!isConnected_ &&
      ( 
        <div className="flex items-center flex-col flex-grow pt-5 mt-40">
          <h2 className="text-[1.8rem] md:text-[2.5rem] text-center h-16 md:h-20">You need to connect your wallet!</h2>
        </div>
      )}

    </>
  );
};

export default Your_StAdds;
