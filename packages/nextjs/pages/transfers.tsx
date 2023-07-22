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

const Transfers: NextPage = () => {
  const [activeItem, setActiveItem] = useState("send-matic");
  const [totalAmount, setTotalAmount] = useState("0");
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

  useEffect(() => {
    setIsConnected_(isConnected);
  }, [isConnected]);

  /*useEffect(() => {
  }, []);*/

  return (
    <>
      <MetaHeader
        title="Transfer Tokens"
        description="Transfer Tokens here!"
      />

      {isConnected_ &&
      ( 
        <div className="flex items-center flex-col flex-grow pt-5 mt-40">
          
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
