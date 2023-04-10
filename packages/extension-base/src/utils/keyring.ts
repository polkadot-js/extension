// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { Keyring } from '@subwallet/keyring';
import { keyring } from '@subwallet/ui-keyring';

// import _decode from '@polkadot/keyring/pair/decode';

function extract (address: string) {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const rs = this.getPair(address);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  console.log(rs.publicKey);
}

export function extractPrivateKey (keyring: Keyring, address: string, password: string) {
  extract.call(keyring, address);
}

export const unlockAccount = (signAddress: string): string | null => {
  let publicKey;

  try {
    publicKey = keyring.decodeAddress(signAddress);
  } catch (error) {
    console.error(error);

    return 'Unable to decode address';
  }

  const pair = keyring.getPair(publicKey);

  if (!pair) {
    return 'Unable to find pair';
  }

  if (pair.isLocked) {
    try {
      keyring.unlockPair(pair.address);
    } catch (e) {
      return (e as Error).message;
    }
  }

  return null;
};

export const lockAccount = (address: string): void => {
  try {
    const pair = keyring.getPair(address);

    if (pair) {
      pair.lock();
    }
  } catch (error) {
    console.error('Unable to lock account', error);
  }
};
