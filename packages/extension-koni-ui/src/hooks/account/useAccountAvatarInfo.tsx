// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useAccountRecoded from '@subwallet/extension-koni-ui/hooks/account/useAccountRecoded';
import { useMemo } from 'react';

import { KeypairType } from '@polkadot/util-crypto/types';

interface Result {
  address: string;
  prefix: number;
}

const useAccountAvatarInfo = (address: string, preventPrefix?: boolean, genesisHash?: string | null, givenType: KeypairType = 'sr25519'): Result => {
  const { formatted, genesisHash: genesisHash_, prefix } = useAccountRecoded(address || '', genesisHash, givenType);

  const avatarAddress = useMemo((): string => {
    if (genesisHash_) {
      return formatted || '';
    } else {
      return (preventPrefix ? address : formatted) || '';
    }
  }, [address, formatted, genesisHash_, preventPrefix]);

  const avatarIdentPrefix = useMemo((): number | undefined => {
    if (genesisHash_) {
      return prefix;
    } else {
      return !preventPrefix ? prefix : undefined;
    }
  }, [genesisHash_, prefix, preventPrefix]);

  return useMemo(() => ({
    address: avatarAddress ?? '',
    prefix: avatarIdentPrefix ?? 42
  }), [avatarAddress, avatarIdentPrefix]);
};

export default useAccountAvatarInfo;
