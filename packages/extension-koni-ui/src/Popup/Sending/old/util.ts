// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringPair } from '@polkadot/keyring/types';
import type { AddressFlags } from './types';

import { BackgroundWindow } from '@subwallet/extension-base/background/KoniTypes';

const bWindow = chrome.extension.getBackgroundPage() as BackgroundWindow;
const { keyring } = bWindow.pdotApi;

const NO_FLAGS = { accountOffset: 0, addressOffset: 0, isHardware: false, isMultisig: false, isProxied: false, isQr: false, isUnlockable: false, threshold: 0, who: [] };

export const UNLOCK_MINS = 15;

const LOCK_DELAY = UNLOCK_MINS * 60 * 1000;

const lockCountdown: Record<string, number> = {};

export function cacheUnlock (pair: KeyringPair): void {
  lockCountdown[pair.address] = Date.now() + LOCK_DELAY;
}

export function lockAccount (pair: KeyringPair): void {
  if ((Date.now() > (lockCountdown[pair.address] || 0)) && !pair.isLocked) {
    pair.lock();
  }
}

export function extractExternal (accountId: string | null): AddressFlags {
  if (!accountId) {
    return NO_FLAGS;
  }

  let publicKey;

  try {
    publicKey = keyring.decodeAddress(accountId);
  } catch (error) {
    console.error(error);

    return NO_FLAGS;
  }

  const pair = keyring.getPair(publicKey);
  const { isExternal, isHardware, isInjected, isMultisig, isProxied } = pair.meta;
  const isUnlockable = !isExternal && !isHardware && !isInjected;

  if (isUnlockable) {
    const entry = lockCountdown[pair.address];

    if (entry && (Date.now() > entry) && !pair.isLocked) {
      pair.lock();
      lockCountdown[pair.address] = 0;
    }
  }

  return {
    accountOffset: pair.meta.accountOffset as number || 0,
    addressOffset: pair.meta.addressOffset as number || 0,
    hardwareType: pair.meta.hardwareType as string,
    isHardware: !!isHardware,
    isMultisig: !!isMultisig,
    isProxied: !!isProxied,
    isQr: !!isExternal && !isMultisig && !isProxied && !isHardware && !isInjected,
    isUnlockable: isUnlockable && pair.isLocked,
    threshold: (pair.meta.threshold as number) || 0,
    who: ((pair.meta.who as string[]) || []).map(recodeAddress)
  };
}

export function recodeAddress (address: string | Uint8Array): string {
  return keyring.encodeAddress(keyring.decodeAddress(address));
}
