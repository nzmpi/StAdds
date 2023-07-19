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

const Your_StAdds: NextPage = () => {
  const [userAddress, setUserAddress] = useState("");
  const [publicKeyLong, setPublicKeyLong] = useState("");
  const [publicKeySource, setPublicKeySource] = useState("");
  const [networkSource, setNetworkSource] = useState("");
  const [userPublicKey, setUserPublicKey] = useState("");
  // avoiding Error: Hydration failed
  const [isConnected_, setIsConnected_] = useState(false);
  const [publicKeyCopied, setPublicKeyCopied] = useState(false); 
  const [gettingPublicKey, setGettingPublicKey] = useState(false); 
  const [errorCustom, setErrorCustom] = useState("");
  const [errorPK, setErrorPK] = useState("");
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
    writeAsync: removePublicKey, 
    isLoading: removePublicKeyLoading 
  } = useScaffoldContractWrite({
    contractName: "StAdds",
    functionName: "removePublicKey",
  });

  const getShortPublicKey = (pubKey: any) => {
    if (!pubKey) return "";
    return pubKey.slice(0, 16) + "..." + pubKey.slice(-14);
  }

  const cleanEverything = () => {
    setErrorCustom("");
    setPublicKeyLong("");
    setPublicKeySource("");
    setNetworkSource("");
  }

  const getFullPublicKey = (pubKey: any) => {
    if (
      !pubKey || 
      (pubKey.x === ethers.ZeroHash &&
       pubKey.y === ethers.ZeroHash)
    ) return "";
    return pubKey.x.slice(0, 68) + pubKey.y.slice(-64);
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

  const getUserPublicKey = (PK: string) => {
    if (PK.length === 132 && PK.slice(0,4) === "0x04") {
      if (getAddressFromPK(PK) === signer) {
        setUserPublicKey(PK);
      } else {
        setErrorPK("Not your Public Key!");
      }      
      return;
    } else if (PK.length === 130) {
      if (getAddressFromPK('0x04' + PK.slice(2)) === signer) {
        setUserPublicKey('0x04' + PK.slice(2));
      } else {
        setErrorPK("Not your Public Key!");
      }      
      return;
    } else {
      setErrorPK("Not a Public Key!");
    }
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

  const handleOnCheck = () => {
    setUserAddress(signer ? signer : "");
    setGettingPublicKey(true);
  }

  useEffect(() => {
    cleanEverything();
    setGettingPublicKey(true);
    setTest("Test: uA: " + userAddress + " PKx: " + PublicKey?.x.toString() + " isZero: " + isPublicKeyZero(PublicKey));
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
  }, [signer]);

  useEffect(() => {
  }, [addPublicKeyLoading, removePublicKeyLoading]);

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
      {"userAddress: " + userAddress}
      </div>
      <div>
      {"Error: " + errorPK}
      </div>

      {isConnected_ &&
      (
      <div className="flex items-center flex-col flex-grow pt-10">
      <div className={"mx-auto mt-7"}>
        <form className={"w-[400px] bg-base-100 rounded-3xl shadow-xl border-pink-700 border-2 p-2 px-7 py-5"}>
        <div className="flex-column">

        {userAddress === "" && 
         publicKeyLong === "" &&
         errorCustom === "" &&
        (
        <div className="mt-3">
          <div>
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
          <div className="mt-3">          
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
          <div className="mt-3">  
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
        </div>
        )}

        </div>
        </form>
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
