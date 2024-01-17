// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';

import { isEthereumAddress } from '@polkadot/util-crypto';

export default function useAccountAvatarTheme (address: string): 'polkadot'|'ethereum' {
  return useMemo(
    (): 'polkadot'|'ethereum' => {
      if (address && isEthereumAddress(address)) {
        return 'ethereum';
      }

      return 'polkadot';
    }, [address]);
}
