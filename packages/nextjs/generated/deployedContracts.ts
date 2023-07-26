const contracts = {
  31337: [
    {
      chainId: "31337",
      name: "localhost",
      contracts: {
        StAdds: {
          address: "0x59b670e9fA9D0A427751Af201D676719a970857b",
          abi: [
            {
              inputs: [],
              stateMutability: "payable",
              type: "constructor",
            },
            {
              inputs: [],
              name: "NotEnoughMATIC",
              type: "error",
            },
            {
              inputs: [],
              name: "NotOwner",
              type: "error",
            },
            {
              inputs: [],
              name: "NotSender",
              type: "error",
            },
            {
              inputs: [],
              name: "PublicKeyNotProvided",
              type: "error",
            },
            {
              inputs: [],
              name: "PublicKeyProvided",
              type: "error",
            },
            {
              inputs: [],
              name: "PublishedDataCooldown",
              type: "error",
            },
            {
              inputs: [],
              name: "PublishedDataExists",
              type: "error",
            },
            {
              inputs: [],
              name: "WrongIndex",
              type: "error",
            },
            {
              anonymous: false,
              inputs: [
                {
                  indexed: true,
                  internalType: "address",
                  name: "sender",
                  type: "address",
                },
                {
                  indexed: false,
                  internalType: "uint256",
                  name: "amount",
                  type: "uint256",
                },
              ],
              name: "FundsWithdrawn",
              type: "event",
            },
            {
              anonymous: false,
              inputs: [
                {
                  indexed: true,
                  internalType: "address",
                  name: "owner",
                  type: "address",
                },
                {
                  indexed: true,
                  internalType: "address",
                  name: "newOwner",
                  type: "address",
                },
              ],
              name: "NewOwnerProposed",
              type: "event",
            },
            {
              anonymous: false,
              inputs: [
                {
                  indexed: true,
                  internalType: "address",
                  name: "sender",
                  type: "address",
                },
                {
                  indexed: false,
                  internalType: "bytes32",
                  name: "PBx",
                  type: "bytes32",
                },
                {
                  indexed: false,
                  internalType: "bytes32",
                  name: "PBy",
                  type: "bytes32",
                },
              ],
              name: "NewPublicKey",
              type: "event",
            },
            {
              anonymous: false,
              inputs: [
                {
                  indexed: true,
                  internalType: "address",
                  name: "sender",
                  type: "address",
                },
                {
                  indexed: true,
                  internalType: "address",
                  name: "receiver",
                  type: "address",
                },
                {
                  indexed: false,
                  internalType: "bytes32",
                  name: "PDx",
                  type: "bytes32",
                },
                {
                  indexed: false,
                  internalType: "bytes32",
                  name: "PDy",
                  type: "bytes32",
                },
              ],
              name: "NewPublishedData",
              type: "event",
            },
            {
              anonymous: false,
              inputs: [
                {
                  indexed: true,
                  internalType: "address",
                  name: "owner",
                  type: "address",
                },
              ],
              name: "OwnershipAccepted",
              type: "event",
            },
            {
              anonymous: false,
              inputs: [
                {
                  indexed: true,
                  internalType: "address",
                  name: "sender",
                  type: "address",
                },
              ],
              name: "PublicKeyRemoved",
              type: "event",
            },
            {
              anonymous: false,
              inputs: [
                {
                  indexed: true,
                  internalType: "address",
                  name: "sender",
                  type: "address",
                },
                {
                  indexed: true,
                  internalType: "uint256",
                  name: "index",
                  type: "uint256",
                },
              ],
              name: "PublishedDataRemoved",
              type: "event",
            },
            {
              inputs: [],
              name: "acceptOwnership",
              outputs: [],
              stateMutability: "payable",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "bytes32",
                  name: "publicKeyX",
                  type: "bytes32",
                },
                {
                  internalType: "bytes32",
                  name: "publicKeyY",
                  type: "bytes32",
                },
              ],
              name: "addPublicKey",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "address",
                  name: "receiver",
                  type: "address",
                },
                {
                  internalType: "bytes32",
                  name: "publishedDataX",
                  type: "bytes32",
                },
                {
                  internalType: "bytes32",
                  name: "publishedDataY",
                  type: "bytes32",
                },
              ],
              name: "addPublishedData",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
            {
              inputs: [],
              name: "ec",
              outputs: [
                {
                  internalType: "contract EC",
                  name: "",
                  type: "address",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "address",
                  name: "_addr",
                  type: "address",
                },
              ],
              name: "getPublicKey",
              outputs: [
                {
                  components: [
                    {
                      internalType: "bytes32",
                      name: "x",
                      type: "bytes32",
                    },
                    {
                      internalType: "bytes32",
                      name: "y",
                      type: "bytes32",
                    },
                  ],
                  internalType: "struct StAdds.Point",
                  name: "",
                  type: "tuple",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "address",
                  name: "_addr",
                  type: "address",
                },
              ],
              name: "getPublishedData",
              outputs: [
                {
                  components: [
                    {
                      internalType: "bytes32",
                      name: "x",
                      type: "bytes32",
                    },
                    {
                      internalType: "bytes32",
                      name: "y",
                      type: "bytes32",
                    },
                    {
                      internalType: "address",
                      name: "creator",
                      type: "address",
                    },
                  ],
                  internalType: "struct StAdds.PublishedData[]",
                  name: "",
                  type: "tuple[]",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "address",
                  name: "recipientAddress",
                  type: "address",
                },
                {
                  internalType: "string",
                  name: "secret",
                  type: "string",
                },
              ],
              name: "getStealthAddressFromAddress",
              outputs: [
                {
                  internalType: "address",
                  name: "stealthAddress",
                  type: "address",
                },
                {
                  internalType: "bytes32",
                  name: "publishedDataX",
                  type: "bytes32",
                },
                {
                  internalType: "bytes32",
                  name: "publishedDataY",
                  type: "bytes32",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "bytes32",
                  name: "publicKeyX",
                  type: "bytes32",
                },
                {
                  internalType: "bytes32",
                  name: "publicKeyY",
                  type: "bytes32",
                },
                {
                  internalType: "string",
                  name: "secret",
                  type: "string",
                },
              ],
              name: "getStealthAddressFromPublicKey",
              outputs: [
                {
                  internalType: "address",
                  name: "stealthAddress",
                  type: "address",
                },
                {
                  internalType: "bytes32",
                  name: "publishedDataX",
                  type: "bytes32",
                },
                {
                  internalType: "bytes32",
                  name: "publishedDataY",
                  type: "bytes32",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "bytes32",
                  name: "privateKey",
                  type: "bytes32",
                },
                {
                  internalType: "bytes32",
                  name: "publishedDataX",
                  type: "bytes32",
                },
                {
                  internalType: "bytes32",
                  name: "publishedDataY",
                  type: "bytes32",
                },
              ],
              name: "getStealthPrivateKey",
              outputs: [
                {
                  internalType: "bytes32",
                  name: "stealthPrivateKey",
                  type: "bytes32",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "address",
                  name: "_addr",
                  type: "address",
                },
              ],
              name: "getTimestamp",
              outputs: [
                {
                  internalType: "uint256",
                  name: "",
                  type: "uint256",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [],
              name: "owner",
              outputs: [
                {
                  internalType: "address",
                  name: "",
                  type: "address",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [],
              name: "pendingOwner",
              outputs: [
                {
                  internalType: "address",
                  name: "",
                  type: "address",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "address",
                  name: "_addr",
                  type: "address",
                },
              ],
              name: "proposeOwner",
              outputs: [],
              stateMutability: "payable",
              type: "function",
            },
            {
              inputs: [],
              name: "removePublicKey",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "index",
                  type: "uint256",
                },
              ],
              name: "removePublishedData",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
            {
              inputs: [],
              name: "timeLock",
              outputs: [
                {
                  internalType: "uint256",
                  name: "",
                  type: "uint256",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [],
              name: "withdraw",
              outputs: [],
              stateMutability: "payable",
              type: "function",
            },
            {
              stateMutability: "payable",
              type: "receive",
            },
          ],
        },
      },
    },
  ],
} as const;

export default contracts;
