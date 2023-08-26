// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

const strings = {
  ERROR_ADDRESS_MESSAGE:
    'QR code not supported, please make sure you are scanning a transaction from a supported software.',
  ERROR_NO_NETWORK:
    'The demanded network is currently not available on this device',
  ERROR_SUPPORT_EVM:
    'SubWallet does not currently support EVM transactions via QR-Signer account',
  ERROR_NO_RAW_DATA: 'There is no raw data from the request',
  ERROR_NO_SENDER_FOUND: 'The chosen account has not been imported into this device. Please import the account and try again.',
  ERROR_NO_EXTERNAL_ACCOUNT: 'The signing feature is not available for this account type',
  ERROR_NO_SENDER_IDENTITY: 'Account not found in wallet',
  ERROR_TITLE: 'Unable to scan',
  ERROR_WRONG_RAW: 'Unable to scan',
  ERROR_NETWORK_INACTIVE: 'Inactive network. Please enable (network name) on this device and try again',
  SUCCESS_TITLE: 'Success'
};

export default strings;
