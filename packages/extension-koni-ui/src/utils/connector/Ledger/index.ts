// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConvertLedgerError } from '@subwallet/extension-koni-ui/types';
import { TFunction } from 'i18next';

export const convertLedgerError = (err: Error, t: TFunction, network: string, isSigning = false, expandError = true): ConvertLedgerError => {
  const error = err;
  const message = error.message;
  const name = error.name;

  switch (name) {
    case 'TransportInterfaceNotAvailable':
      return {
        message: t('Please make sure that this browser tab is the only tab connecting to Ledger'),
        status: 'error'
      };
  }

  if (
    message.includes('Locked device') ||
    message.includes('Device Locked')
  ) {
    return {
      status: 'warning',
      message: t('Please unlock your Ledger')
    };
  }

  if (
    message.includes('App does not seem to be open') || // App not open
    message.includes('Unknown Status Code: 28161') || // Substrate stay in dashboard
    message.includes('Unknown Status Code: 28160') || // Substrate stay in dashboard
    message.includes('CLA_NOT_SUPPORTED') // Evm wrong app
  ) {
    if (isSigning) {
      return {
        status: 'error',
        message: t('Unable to sign. Open “{{network}}” on Ledger, refresh and approve again', { replace: { network: network } })
      };
    } else {
      return {
        status: 'error',
        message: t('Open "{{network}}" on Ledger to connect', { replace: { network: network } })
      };
    }
  }

  // Required blind signing or sign on a not registry network
  if (message.includes('Please enable Blind signing or Contract data in the Ethereum app Settings')) {
    return {
      status: 'error',
      message: t('Please open the Ethereum app and enable Blind signing or Contract data')
    };
  }

  // Device disconnected
  if (message.includes('The device was disconnect') ||
    message.includes('A transfer error has occurred')
  ) {
    return {
      status: 'error',
      message: t('Your Ledger is disconnected. Reconnect and try again')
    };
  }

  // Have a request in queue
  if (
    message.includes('Cannot set property message of  which has only a getter') || // EVM
    message.includes("Failed to execute 'transferIn' on 'USBDevice'") || // Substrate
    message.includes("Failed to execute 'transferOut' on 'USBDevice'") // Substrate
  ) {
    return {
      status: 'error',
      message: t('Another request is in queue. Please try again later')
    };
  }

  // User reject request
  if (
    message.includes('User rejected') || // EVM
    message.includes('Transaction rejected') // Substrate
  ) {
    return {
      status: 'error',
      message: t('Rejected by user')
    };
  }

  // App transaction version out of data
  if (message.includes('Txn version not supported')) {
    return {
      status: 'error',
      message: t('"{{network}}" is out of date. Please update your device with Ledger Live', { replace: { network: network } })
    };
  }

  console.warn('Unknown ledger error', { error });

  if (expandError) {
    return {
      status: 'error',
      message: message
    };
  }

  return {
    status: 'error',
    message: t('Fail to connect. Click to retry')
  };
};
