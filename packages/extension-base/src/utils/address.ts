// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { reformatAddress } from '@subwallet/extension-base/utils/index';

import { decodeAddress, encodeAddress, isEthereumAddress } from '@polkadot/util-crypto';

export const simpleAddress = (address: string): string => {
  if (isEthereumAddress(address)) {
    return address;
  }

  return encodeAddress(decodeAddress(address));
};

export function quickFormatAddressToCompare (address?: string) {
  if (!address) {
    return address;
  }

  if (address.startsWith('5')) {
    return address.toLowerCase();
  } else if (address.startsWith('0x')) {
    return address.toLowerCase();
  } else {
    return reformatAddress(address, 42).toLowerCase();
  }
}
