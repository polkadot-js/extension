// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { decodeAddress, encodeAddress, isEthereumAddress } from '@polkadot/util-crypto';

export const simpleAddress = (address: string): string => {
  if (isEthereumAddress(address)) {
    return address;
  }

  return encodeAddress(decodeAddress(address));
};
