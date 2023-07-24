//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

library Errors {
  error NotOwner();
  error NotSender();
  error PublicKeyProvided();
  error PublicKeyNotProvided();
  error NotEnoughMATIC();
  error WrongIndex();
  error PublishedDataExists();
  error PublishedDataCooldown();
}
