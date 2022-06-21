// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

const strings = {
  ERROR_ADDRESS_MESSAGE:
    'QR code not supported, please make sure you are scanning a transaction from a supported software.',
  ERROR_NO_NETWORK:
    'SubWallet does not currently recognize a chain with genesis hash, please add the network first',
  ERROR_SUPPORT_EVM:
    'SubWallet does not currently support EVM payload',
  ERROR_NO_RAW_DATA: 'There is no raw data from the request',
  ERROR_NO_SENDER_FOUND: 'There is no related account in the app',
  ERROR_NO_EXTERNAL_ACCOUNT: 'There is external account',
  ERROR_NO_SENDER_IDENTITY: 'There is no related identity in the app',
  ERROR_TITLE: 'Unable to parse QR data',
  ERROR_WRONG_RAW:
    'Frames number is too big, the QR seems not to be a recognized extrinsic raw data',
  INFO_ETH_TX: 'You are about to send the following amount',
  INFO_MULTI_PART:
    'You are about to send the following extrinsic. We will sign the hash of the payload as it is oversized.',
  SUCCESS_ADD_NETWORK: 'Successfully updated new network: ',
  SUCCESS_TITLE: 'Success'
};

export default strings;
