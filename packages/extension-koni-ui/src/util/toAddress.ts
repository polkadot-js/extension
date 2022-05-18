// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// import { keyring } from '@polkadot/ui-keyring';
import { assert, hexToU8a, isHex } from '@polkadot/util';
import { decodeAddress, encodeAddress, ethereumEncode } from '@polkadot/util-crypto';

export function toAddress (value?: string | Uint8Array | null, allowIndices = false): string | undefined {
  if (value) {
    try {
      const u8a = isHex(value)
        ? hexToU8a(value)
        : decodeAddress(value);

      assert(allowIndices || u8a.length === 32 || u8a.length === 20, 'AccountIndex values not allowed');

      if (u8a.length === 20) {
        return ethereumEncode(u8a);
      } else {
        return encodeAddress(u8a);
      }
    } catch (error) {
      // noop, undefined return indicates invalid/transient
    }
  }

  return undefined;
}
