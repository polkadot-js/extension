// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

const strings = {
  ERROR_ADDRESS_MESSAGE:
    'QR code not supported, please make sure you are scanning a transaction from a supported software.',
  ERROR_NO_NETWORK:
    'The demanded network is currently not available on this device',
  ERROR_SUPPORT_EVM:
    'SubWallet does not currently support EVM payload',
  ERROR_NO_RAW_DATA: 'There is no raw data from the request',
  ERROR_NO_SENDER_FOUND: 'Account has not been imported into this device. Please import an account and try again.',
  ERROR_NO_EXTERNAL_ACCOUNT: 'The signing feature is not available for this account type',
  ERROR_NO_SENDER_IDENTITY: 'There is no related identity in the app',
  ERROR_TITLE: 'Unable to parse QR data',
  ERROR_WRONG_RAW:
    'Frames number is too big, the QR seems not to be a recognized extrinsic raw data',
  ERROR_NETWORK_INACTIVE: 'Inactive network. Please activate (network name) on this device and try again',
  INFO_ETH_TX: 'You are about to send the following amount',
  INFO_MULTI_PART:
    'You are about to send the following extrinsic. We will sign the hash of the payload as it is oversized.',
  SUCCESS_ADD_NETWORK: 'Successfully updated new network: ',
  SUCCESS_TITLE: 'Success'
};

export default strings;
