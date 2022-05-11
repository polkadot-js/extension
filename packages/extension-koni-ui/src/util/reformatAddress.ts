// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { isAccountAll } from '@subwallet/extension-koni-ui/util/accountAll';
import { decodeAddress, encodeAddress, ethereumEncode, isEthereumAddress } from '@polkadot/util-crypto';

export default function reformatAddress (address: string, networkPrefix: number, isEthereum = false): string {
  if (isAccountAll(address)) {
    return address;
  }

  if (isEthereumAddress(address)) {
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
