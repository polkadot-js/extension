// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { isAccountAll } from '@subwallet/extension-web-ui/utils/account/accountAll';

import { decodeAddress, encodeAddress, ethereumEncode, isAddress, isEthereumAddress } from '@polkadot/util-crypto';

export default function reformatAddress (address: string, networkPrefix = 42, isEthereum = false): string {
  if (!isAddress(address)) {
    return address;
  }

  if (isAccountAll(address)) {
    return address;
  }

  if (isEthereumAddress(address)) {
    return address;
  }

  try {
    const publicKey = decodeAddress(address);

    if (isEthereum) {
      return ethereumEncode(publicKey);
    }

    if (networkPrefix < 0) {
      return address;
    }

    return encodeAddress(publicKey, networkPrefix);
  } catch {
    return address;
  }
}
