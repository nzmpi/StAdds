//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

library Errors {
  error NotOwner();
  error NotSinger();
  error PublicKeyProvided();
  error PublicKeyNotProvided();
  error NotEnoughMATIC();
  error DidntSend();
  error WrongIndex();
  error PublishedDataExists();
  error PublishedDataCooldown();
}
