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
import * as dotenv from "dotenv";
dotenv.config();

const Your_StAdds: NextPage = () => {
  const [pubKeyInput, setPubKeyInput] = useState("Hash");
  const [networkInput, setNetworkInput] = useState("Ethereum");
  const [addressFrom, setAddressFrom] = useState("");
  // avoiding Error: Hydration failed
  const [isConnected_, setIsConnected_] = useState(false);
  const [publicKeyCopied, setPublicKeyCopied] = useState(false);
  const {address: signer, isConnected} = useAccount();

  const [test, setTest] = useState<any>();

 
  const { data: PublicKey } = useScaffoldContractRead({
    contractName: "StAdds",
    functionName: "getPublicKey",
    args: [signer],
  });

  const getShortPublicKey = (pubKey: any) => {
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
  
  async function getHash() { 
    const network = "mainnet";
    const API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY;
    const infuraProvider = new ethers.InfuraProvider(
      "sepolia",
      API_KEY,
    );
    const txHash = '0x98866a8dac4ba6b19375a6453bc7adeedb918151c5c736bc62ce7631990f5f9f';
    //const tx = await provider.getTransaction(txHash);
    const count = await infuraProvider.getTransactionCount('0x02d09E69e528d7DA14F32Cd21b55aFFa1FF7F873');
    setTest(count);
  }

  useEffect(() => {
    setIsConnected_(isConnected);
  }, [isConnected]);

  useEffect(() => {
    getHash();
  }, [networkInput]);

  return (
    <>
      <MetaHeader
        title="Your StAdds"
        description="Get your StAdds here!"
      />
      {test|| "s"}
      {isConnected_ &&
      (
      <div className="flex items-center flex-col flex-grow pt-10">
      <div className={"mx-auto mt-7"}>
        <form className={"w-[400px] bg-base-100 rounded-3xl shadow-xl border-pink-700 border-2 p-2 px-7 py-5"}>
        <div className="flex-column">
        {getFullPublicKey(PublicKey) === "" &&
        (
        <div>          
        <span className="text-2xl">Add your Public Key!</span>
          {pubKeyInput === "Hash" &&
          (          
          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text font-bold">
                Your hash:
              </span>
            </label>

            <div style={{ display: "flex" }}> 
              <select
                value={networkInput}
                onChange={e => setNetworkInput(e.target.value)}
                className="select select-bordered bg-primary-500 input-sm w-[120px] flex border-2 border-orange-400 focus:outline-none shadow"
                style={{ marginLeft: "auto" }}
              >
              <option value="Ethereum">Ethereum</option>
              <option value="Goerli">Goerli</option>
              <option value="Sepolia">Sepolia</option>
              <option value="Polygon">Polygon</option>
              <option value="Mumbai">Mumbai</option>
              </select>
            </div>
                         
          </div>
          )}

          <div style={{ display: "flex" }}> 
          <select
            value={pubKeyInput}
            onChange={e => setPubKeyInput(e.target.value)}
            className="select select-bordered bg-primary-500 input-sm w-[120px] flex border-2 border-orange-400 focus:outline-none shadow"
            style={{ marginLeft: "auto" }}
          >
          <option value="Hash">Hash</option>
          <option value="Breadable">Breadable</option>
          </select>
          </div>

        </div>
        )}

        {getFullPublicKey(PublicKey) !== "" &&
        (
        <div>          
        <span className="text-3xl">Your Public Key</span>

        <div className="form-control mb-3">
          <div className="flex flex-row mx-3">
            {getShortPublicKey(PublicKey)}
            
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
