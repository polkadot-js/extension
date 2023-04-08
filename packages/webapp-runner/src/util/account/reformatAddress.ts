// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { isAccountAll } from "@subwallet-webapp/util/account/accountAll";

import {
  decodeAddress,
  encodeAddress,
  ethereumEncode,
  isEthereumAddress,
} from "@polkadot/util-crypto";

export default function reformatAddress(
  address: string,
  networkPrefix = 42,
  isEthereum = false
): string {
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

export function quickFormatToCompare(address?: string) {
  if (!address) {
    return address;
  }

  if (address.startsWith("5")) {
    return address.toLowerCase();
  } else if (address.startsWith("0x")) {
    return address.toLowerCase();
  } else {
    return reformatAddress(address, 42).toLowerCase();
  }
}
