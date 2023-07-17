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
import { AddressInput, Address } from "~~/components/scaffold-eth";
import { CheckCircleIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Spinner } from "~~/components/Spinner";
import * as dotenv from "dotenv";
dotenv.config();

const Your_StAdds: NextPage = () => {
  const [pubKeyInput, setPubKeyInput] = useState("Address");
  const [addressFrom, setAddressFrom] = useState("");
  const [signerAddress, setSignerAddress] = useState("");
  const [publicKeyLong, setPublicKeyLong] = useState("");
  // avoiding Error: Hydration failed
  const [isConnected_, setIsConnected_] = useState(false);
  const [publicKeyCopied, setPublicKeyCopied] = useState(false);  
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
  const [errorHash, setErrorHash] = useState("");
  const {address: signer, isConnected} = useAccount();

  const [test, setTest] = useState<any>();
 
  const { data: PublicKey } = useScaffoldContractRead({
    contractName: "StAdds",
    functionName: "getPublicKey",
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

  const getShortPublicKey1Line = (pubKey: any) => {
    if (!pubKey) return "";
    return pubKey.slice(0, 16) + "..." + pubKey.slice(-14);
  }

  const getShortPublicKey2Coord = (pubKey: any) => {
    if (
      !pubKey || 
      (pubKey.x === ethers.ZeroHash &&
        pubKey.y === ethers.ZeroHash)
    ) return "";
    return "0x04" + pubKey.x.slice(2, 14) + "..." + pubKey.y.slice(-14);
  }

  const getFullPublicKey = (pubKey: any) => {
    if (
      !pubKey || 
      (pubKey.x === ethers.ZeroHash &&
       pubKey.y === ethers.ZeroHash)
    ) return "";
    return pubKey.x.slice(0, 68) + pubKey.y.slice(-64);
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
  
  async function getPubKey() {
    if (!ethers.isAddress(addressFrom)) {
      return;
    }
    for (let i = 0 ; i < networks.length; ++i) {
      const network = networks[i];
      const baseUrl = baseUrls.get(network);
      const SCAN_API_KEY = getApiKey(network);      
      const url = `${baseUrl}?module=account&action=txlist&address=${addressFrom}&startblock=0&endblock=99999999&page=1&offset=1&sort=desc&apikey=${SCAN_API_KEY}`;
      const res = await fetch(url);
      const jsonData = await res.json();

      let txHash;
      if (jsonData.message !== "OK") {
        setErrorHash("No transactions found!");
        continue;
      } else {
        setErrorHash("");
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
      const serializedTx = ethers.Transaction.from(unsignedTx).unsignedSerialized;
      const PK = ethers.SigningKey.recoverPublicKey(
        ethers.keccak256(serializedTx),
        signature || ""
      );
      const address = ethers.getAddress('0x' + ethers.keccak256('0x' + PK.slice(4)).slice(-40));
      if (address !== addressFrom) {
        setErrorHash("Something wrong with the Public Key!");
        continue;
      } else {
        setPublicKeyLong(PK);
        setErrorHash("");
        return;
      }
    }
  }

  useEffect(() => {
    setIsConnected_(isConnected);
  }, [isConnected]);

  useEffect(() => {
    setErrorHash("");
    setPublicKeyLong("");
    getPubKey();
  }, [addressFrom]);

  return (
    <>
      <MetaHeader
        title="Your StAdds"
        description="Get your StAdds here!"
      />
      {publicKeyLong || "s"}
      {" " + errorHash + "PK: " + `0x$(publicKeyLong.slice(4, 68))`}
      {isConnected_ &&
      (
      <div className="flex items-center flex-col flex-grow pt-10">
      <div className={"mx-auto mt-7"}>
        <form className={"w-[400px] bg-base-100 rounded-3xl shadow-xl border-pink-700 border-2 p-2 px-7 py-5"}>
        <div className="flex-column">

        <div>          
        <span className="text-2xl">Get Public Key</span>
          {pubKeyInput === "Address" &&
          (          
          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text font-bold">
                User's address:
              </span>
            </label>
            <AddressInput placeholder="Address" value={addressFrom} 
              onChange={value => {
                if (value === "") {
                  setAddressFrom("");
                } else   
                  setAddressFrom(value);
              }}
            />  
            {!ethers.isAddress(addressFrom) && addressFrom !== "" && (
              <span className="mt-2 ml-2 text-[0.95rem] text-red-500">
                Not an address!
              </span>
            )}            
          </div>
          )}

          <div>
          <div style={{ display: "flex" }}>          
            <select
              value={pubKeyInput}
              onChange={(e) => setPubKeyInput(e.target.value)}
              className="select select-bordered bg-primary-500 input-sm w-[120px] flex border-2 border-orange-400 focus:outline-none shadow"
              style={{ marginLeft: "auto" }}
            >
            <option value="Address">Address</option>
            <option value="PK1line">Public Key</option>
            </select>
          </div>          
          </div>
        </div>

        {publicKeyLong !== "" &&
        (
        <div className="form-control mb-3 mt-5">
          <label className="label">
            <span className="label-text font-bold">Their Public Key:</span>
          </label>
          <div className="flex flex-row mx-3">
            {getShortPublicKey1Line(publicKeyLong)}
            
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
          <div className="mt-3 flex flex-col items-center py-2">
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
              save
            </>
            )}
            </button>
          </div>
        </div>
        )}
        
        {getFullPublicKey(PublicKey) === "" &&
        (
        <div className="mt-10">          
        <div>
        <span className="text-2xl">We don't have your Public Key</span>
        </div>
        <div>
        <span className="text-1xl flex justify-center">Use the form above!</span>
        </div>
        </div>
        )}

        {getFullPublicKey(PublicKey) !== "" &&
        (
        <div>          
        <span className="text-3xl">Your Public Key</span>

        <div className="form-control mb-3">
          <div className="flex flex-row mx-3">
            {getShortPublicKey2Coord(PublicKey)}
            
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
              className="text-xl font-normal text-orange-600 h-5 w-5 cursor-pointer mx-2"
            />
            </CopyToClipboard>
            )}
          </div>
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
