import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";
import React,{ useState, useEffect } from "react";
import { ethers } from "ethers"; // v6
import { AddressInput, Address } from "~~/components/scaffold-eth";
import { 
  useScaffoldContractRead,
  useDeployedContractInfo,
  useScaffoldContractWrite,
  useScaffoldEventSubscriber
} from "~~/hooks/scaffold-eth";
import { CheckCircleIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Spinner } from "~~/components/Spinner";
import { useAccount } from 'wagmi';
import Countdown from "react-countdown";
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const Home: NextPage = () => {
  const [addressTo, setAddressTo] = useState("");
  const [publicKeyCopied, setPublicKeyCopied] = useState(false);
  const [publishedDataCopied, setPublishedDataCopied] = useState(false);
  const [publicKeyLong, setPublicKeyLong] = useState("");
  const [secret, setSecret] = useState("");
  const [stealthAddress, setStealthAddress] = useState("");
  const [publishedData, setPublishedData] = useState("");
  const [publishedDataPoint, setPublishedDataPoint] = useState<any>();
  const [publishedDataExists, setPublishedDataExists] = useState(true);
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const {address: signer} = useAccount();
  const [test, setTest] = useState<any>();

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

  const { data: PublishedData } = useScaffoldContractRead({
    contractName: "StAdds",
    functionName: "getPublishedData",
    args: [addressTo],
  });

  const { data: Timestamp } = useScaffoldContractRead({
    contractName: "StAdds",
    functionName: "getTimestamp",
    args: [signer],
  });

  const { 
    writeAsync: addPublishedData, 
    isLoading: addPublishedDataLoading 
  } = useScaffoldContractWrite({
    contractName: "StAdds",
    functionName: "addPublishedData",
    args: [addressTo, publishedDataPoint?.x || "", publishedDataPoint?.y || ""],
  });

  const getShortPublicKey = () => {
    if (
      !PublicKey || 
      (PublicKey.x === ethers.ZeroHash &&
       PublicKey.y === ethers.ZeroHash)
    ) return "";
    return "0x04" + PublicKey.x.slice(2, 14) + "..." + PublicKey.y.slice(-14);
  }

  const getShortPublishedData = () => {
    if (publishedData === "") return "";
    return publishedData.slice(0, 15) + "..." + publishedData.slice(-14);
  }

  const checkPublishedData = () => {
    if (!PublishedData) return true;
    if (PublishedData.length === 0) return false;
    
    for (let i = 0; i < PublishedData.length; i++) {
      if (
        PublishedData[i].x === publishedDataPoint?.x &&
        PublishedData[i].y === publishedDataPoint?.y
      ) return true;
    }

    return false;
  }

  useEffect(() => {
    if (!ethers.isAddress(addressTo) || !PublicKey) {
      setPublicKeyLong("");
      return; 
    }
    setPublicKeyLong("0x04" + PublicKey.x.slice(2) + PublicKey.y.slice(2));
  }, [addressTo]);

  useEffect(() => {
    if (secret === "" || !PublicKey ) {
      setStealthAddress("");
      setPublishedData("");
      return;
    }
    const secretToNumber = ethers.keccak256(ethers.toUtf8Bytes(secret));
    // Remove "0x" prefix for elliptic library  
    const publicKeyXString = PublicKey.x.slice(2);
    const publicKeyYString = PublicKey.y.slice(2);
    const publicKey = ec.curve.point(publicKeyXString, publicKeyYString);
    const sharedSecretPoint = publicKey.mul(secretToNumber.slice(2));
    const sharedSecretX = ethers.toBeHex(sharedSecretPoint.getX().toString());
    const sharedSecretY = ethers.toBeHex(sharedSecretPoint.getY().toString());
    const sharedSecretToNumber = ethers.solidityPackedKeccak256(
      ['uint256', 'uint256'],
      [ sharedSecretX, sharedSecretY ]
    );

    const sharedSecretGPoint = ecG.mul(sharedSecretToNumber);
    const stealthPublicKey = publicKey.add(sharedSecretGPoint);
    const stealthPublicX = ethers.toBeHex(stealthPublicKey.getX().toString());
    const stealthPublicY = ethers.toBeHex(stealthPublicKey.getY().toString());
    const stealthPublicKeyToNumber = ethers.solidityPackedKeccak256(
      ['uint256', 'uint256'],
      [ stealthPublicX, stealthPublicY ]
    );

    // Biggest number allowed for addresses
    // https://ethereum.stackexchange.com/questions/10055/is-each-ethereum-address-shared-by-theoretically-2-96-private-keys
    const modulo = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
    const stealthAddress_ = '0x' + ethers.toBeHex(BigInt(stealthPublicKeyToNumber) % (modulo)).slice(-40);
    setStealthAddress(stealthAddress_);

    const publishedData_ = ecG.mul(secretToNumber);
    const publishedData_X = ethers.toBeHex(publishedData_.getX().toString());
    const publishedData_Y = ethers.toBeHex(publishedData_.getY().toString());
    setPublishedData(publishedData_X + publishedData_Y.slice(2));
    setPublishedDataPoint({x: publishedData_X, y: publishedData_Y});
  }, [secret]);

  useEffect(() => {
    setPublishedDataExists(checkPublishedData());
  }, [publishedDataPoint, PublishedData]);

  useEffect(() => {
    if (!Timestamp || Timestamp < Date.now()/1000) {
      setIsOnCooldown(false);
      return;
    }
    if (Timestamp > Date.now()/1000) setIsOnCooldown(true);
  }, [Timestamp]);

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
    {Number(Timestamp)}
    {" "}
    {Date.now()/1000}
      <MetaHeader/>
      <div className="flex items-center flex-col flex-grow pt-10">
      <div className={"mx-auto mt-7"}>
        <form className={"w-[400px] bg-base-100 rounded-3xl shadow-xl border-pink-700 border-2 p-2 px-7 py-5"}>
        <div className="flex-column">
          <span className="text-3xl">Create Stealth Address</span>

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
                  } else   
                    setAddressTo(value);
                }}
              />              
          </div>
          {!ethers.isAddress(addressTo) && addressTo !== "" && (
            <span className="ml-2 text-[0.95rem] text-red-500">
              Not an address!
            </span>
          )}

          {addressTo === ""  
          }

          {addressTo !== "" &&
          getShortPublicKey() !== "" &&
          (
          <div>
          <div className="form-control mb-3">
          <label className="label">
            <span className="label-text font-bold">Their Public Key:</span>
          </label>
          <div className="flex flex-row mx-3">
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

          <div className="form-control mb-3">
          <label className="label">
            <span className="label-text font-bold">
              Enter Your Secret:
            </span>
          </label>
          <textarea
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="Secret"
            rows={2}
            className="mt-1 input-md border-2 bg-base-200 border-orange-400 rounded-3xl px-4 py-1.5 focus:outline-none focus:text-gray-600 placeholder:text-grey-400 text-gray-400"
          />
          </div>
          
          {stealthAddress && 
          (
          <div>
          <div className="form-control mb-3">
          <label className="label">
            <span className="label-text font-bold">
              Their Stealth Address:
            </span>
          </label>
            <div className="mx-3">
              <Address address={stealthAddress}/>
            </div>
          </div>

          <div className="form-control mb-3">
          <label className="label">
            <span className="label-text font-bold">
              Their Published Data:
            </span>
          </label>
          <div className="flex flex-row mx-3">
            {getShortPublishedData()}
            
            {publishedDataCopied ? (
            <CheckCircleIcon
              className="ml-1.5 text-xl font-normal text-orange-600 h-5 w-5 cursor-pointer"
              aria-hidden="true"
            />
            ) : (
            <CopyToClipboard
              text={publishedData}
              onCopy={() => {
                setPublishedDataCopied(true);
              setTimeout(() => {
                setPublishedDataCopied(false);
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
          (                  
          <div className="mt-3 flex flex-col items-center py-2">
            <button
              type="button"
              disabled={publishedDataExists}              
              onClick={async () => {await addPublishedData();}}
              className={"btn btn-warning font-black w-1/3 flex items-center"}
            >              
            {addPublishedDataLoading && (
            <>
              <Spinner/>
            </>
            )}
            {!addPublishedDataLoading && 
             !publishedDataExists &&
            (
            <>
              save
            </>
            )}
            {!addPublishedDataLoading && 
             publishedDataExists &&
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
          <div className="flex flex-row items-center card-body p-5 pb-2 mx-8">
            <span className="label-text font-bold">             
              You are on cooldown: 
            </span>
            <MemoCountdown/>
          </div>
          )}
          
          </div>            
          )}
          </div>
          )}       
          

        </div>
        </form>
      </div>

      {isOnCooldown.toString()}
      <div>
        {PublishedData?.length}
      </div>

      </div>
    </>
  );
};

export default Home;
