# StAdds

A dApp that helps users create and retrieve stealth addresses.

Site: https://stadds.vercel.app

Contract on Polygon: https://polygonscan.com/address/0x9F3A3E1db87524D75f2A4b6d26c42b39043d4aB5

## How to use

In the `Home` tab:

 - Enter the receiver's address.
 - The dApp checks the contract for the public key, if no public key is provided, it checks various chains for a transaction to get their public key.
 - Write a secret, which acts as a salt (more complex is better against bruteforce attacks).
 - Send the shared secret to the receiver, so they can obtain the stealth private key for the stealth address.
 - You can save the shared secret to the contract, but it will create a "link" between the creator and the receiver (the stealth address remains unknown to everyone except the creator and the receiver).

In the `Your StAdds` tab:

 - You can add your public key.
 - You can check all of your shared secrets (if you have any saved to the contract).
 - You can retrieve the stealth private key using a shared secret and your private key (you can either turn off your Internet or use [this](https://github.com/nzmpi/StAdds/blob/main/packages/hardhat/helper.js#L32) function to get the stealth private key).

## Acknowledgment 

Frontend built with [Scaffold-Eth 2](https://github.com/scaffold-eth/scaffold-eth-2).
