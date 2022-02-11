// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { decodeAddress, encodeAddress, ethereumEncode, isEthereumAddress } from '@polkadot/util-crypto';
import {isAccountAll} from "@polkadot/extension-koni-ui/util/accountAll";

export default function reformatAddress (address: string, networkPrefix: number, isEthereum = false): string {
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
