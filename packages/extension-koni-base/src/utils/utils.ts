// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PINATA_SERVER } from '@polkadot/extension-koni-base/api/nft/rmrk_nft/config';
import { decodeAddress, encodeAddress, ethereumEncode, isEthereumAddress } from '@polkadot/util-crypto';
import {ALL_ACCOUNT_KEY} from "@polkadot/extension-koni-base/constants";

export const notDef = (x: any) => x === null || typeof x === 'undefined';
export const isDef = (x: any) => !notDef(x);
export const nonEmptyArr = (x: any) => Array.isArray(x) && x.length > 0;
export const isEmptyArray = (x: any) => !Array.isArray(x) || (Array.isArray(x) && x.length === 0);

export function isAccountAll (address: string): boolean {
  return address === ALL_ACCOUNT_KEY;
}

export function reformatAddress (address: string, networkPrefix: number, isEthereum = false): string {
  if (isEthereumAddress(address)) {
    return address;
  }

  if (isAccountAll(address)) {
    return address;
  }

  const publicKey = decodeAddress(address);

  if (isEthereum) {
    return ethereumEncode(publicKey);
  }

  if (networkPrefix < 0) {
    return address;
  }

  return encodeAddress(publicKey, networkPrefix);
}

export function isUrl (targetString: string) {
  let url;

  try {
    url = new URL(targetString);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
}

export function inJestTest () {
  return process.env.JEST_WORKER_ID !== undefined;
}

export const parseIpfsLink = (ipfsLink: string) => {
  if (!ipfsLink.includes('ipfs://ipfs/')) return ipfsLink;

  return PINATA_SERVER + ipfsLink.split('ipfs://ipfs/')[1];
};
