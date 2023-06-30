// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConvertLedgerError } from '@subwallet/extension-koni-ui/types';
import { TFunction } from 'i18next';

export const convertLedgerError = (err: Error, t: TFunction, network: string): ConvertLedgerError => {
  const error = err;
  const message = error.message;
  const name = error.name;

  switch (name) {
    case 'TransportInterfaceNotAvailable':
      return {
        status: 'error',
        message: t('Please make sure that this browser tab is the only tab connecting to Ledger')
      };
  }

  if (message.includes('Locked device')) {
    return {
      status: 'warning',
      message: t('Please unlock your Ledger')
    };
  }

  if (
    message.includes('App does not seem to be open') || // App not open
    message.includes('Unknown Status Code: 28161') || // Substrate stay in dashboard
    message.includes('CLA_NOT_SUPPORTED (0x6e00)') // Evm wrong app
  ) {
    return {
      status: 'error',
      message: t('Open "{{network}}" on Ledger to connect', { replace: { network: network } })
    };
  }

  // Required blind signing or sign on a not registry network
  if (message.includes('Please enable Blind signing or Contract data in the Ethereum app Settings')) {
    return {
      status: 'error',
      message: t('Please open the Ethereum app and enable Blind signing or Contract data')
    };
  }

  // Have a request in queue
  if (
    message.includes('Cannot set property message of  which has only a getter') || // EVM
    message.includes("Failed to execute 'transferIn' on 'USBDevice'") // Substrate
  ) {
    return {
      status: 'error',
      message: t('Another request is in queue. Please try again later')
    };
  }

  console.warn('Unknown ledger error', { error });

  return {
    status: 'error',
    message: t('Fail to connect. Click to retry')
  };
};
