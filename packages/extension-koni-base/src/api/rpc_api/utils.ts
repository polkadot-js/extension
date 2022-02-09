// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

// Node >= 14 doesnt have require by default. Fix this maybe ?
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { BN, hexToU8a, isHex } from '@polkadot/util';

export const loadJSON = (path: string) => {
  try {
    return require(path);
  } catch (e) {
    console.log(e);
    console.log('Error parsing JSON file');
  }
};

export const isValidAddress = (address: string) => {
  try {
    encodeAddress(
      isHex(address)
        ? hexToU8a(address)
        : decodeAddress(address)
    );

    return true;
  } catch (error) {
    return false;
  }
};

export const toUnit = (balance: number, decimals: number) => {
  const base = new BN(10).pow(new BN(decimals));
  const dm = new BN(balance).divmod(base);

  return parseFloat(dm.div.toString() + '.' + dm.mod.toString());
};
