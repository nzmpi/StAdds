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

const Transfers: NextPage = () => {
  const [activeItem, setActiveItem] = useState("send-matic");
  const [totalAmount, setTotalAmount] = useState("0");
  const [tokenContract, setTokenContract] = useState("");
  // avoiding Error: Hydration failed
  const [isConnected_, setIsConnected_] = useState(false);
  const {address: signer, isConnected} = useAccount();
  const [indexToRemove, setIndexToRemove] = useState(-1);

  const [test, setTest] = useState<any>();

  const { data: PublishedData } = useScaffoldContractRead({
    contractName: "StAdds",
    functionName: "getPublishedData",
    args: [signer],
  });

  const { 
    writeAsync: removePublishedData, 
    isLoading: removePublishedDataLoading 
  } = useScaffoldContractWrite({
    contractName: "StAdds",
    functionName: "removePublishedData",
    args: [BigInt(indexToRemove)],
  });

  function handleItemClick(itemId: string) {
    setActiveItem(itemId);
  }

  useEffect(() => {
    setIsConnected_(isConnected);
  }, [isConnected]);

  useEffect(() => {
  }, [activeItem]);

  return (
    <>
      <MetaHeader
        title="Transfer Tokens"
        description="Transfer Tokens here!"
      />

      {isConnected_ &&
      ( 
      <div className="flex items-center flex-col pt-8">
      <ul className="menu menu-horizontal bg-secondary rounded-box activemenu border border-pink-700">
          <li onClick={() => handleItemClick("send-matic")}>
            <a className={activeItem === "send-matic" ? "active bg-orange-400" : ""}>
              Send MATIC
            </a>
          </li>          
          <li onClick={() => handleItemClick("send-ERC20")}>
            <a className={activeItem === "split-tokens" ? "active bg-orange-400" : ""}>
              Send ERC20
            </a>
          </li>                   
          <li onClick={() => handleItemClick("send-ERC721")}>
            <a className={activeItem === "split-tokens" ? "active bg-orange-400" : ""}>
              Send ERC721
            </a>
          </li>
        </ul>
      </div>
      )}

      {isConnected_ &&
      activeItem === "send-matic" &&
      ( 
      <div className="flex items-center flex-col flex-grow pt-10">
      <div className={"mx-auto"}>
      <form className={"w-[400px] bg-base-100 rounded-3xl shadow-xl border-pink-700 border-2 p-2 px-7 py-5"}>
        <div className="flex-column">

        

        </div>
      </form>
      </div>
      </div>
      )}

      {isConnected_ &&
      activeItem === "send-ERC20" &&
      ( 
      <div className="flex items-center flex-col flex-grow pt-10">
      <div className={"mx-auto"}>
      <form className={"w-[400px] bg-base-100 rounded-3xl shadow-xl border-pink-700 border-2 p-2 px-7 py-5"}>
        <div className="flex-column">

        

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

export default Transfers;
