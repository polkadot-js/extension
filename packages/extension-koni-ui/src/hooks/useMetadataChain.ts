// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Chain } from '@subwallet/extension-chains/types';

import { useCallback, useEffect, useState } from 'react';

import { getChainMetadata } from '../messaging';

export default function useMetadataChain (genesisHash?: string, setChainLoading?: (val: boolean) => void): Chain | null {
  const [chain, setChain] = useState<Chain | null>(null);

  const handlerUpdateLoading = useCallback((val: boolean) => {
    setChainLoading && setChainLoading(val);
  }, [setChainLoading]);

  useEffect((): void => {
    handlerUpdateLoading(true);

    if (genesisHash) {
      getChainMetadata(genesisHash)
        .then(setChain)
        .catch((error): void => {
          console.error(error);
          setChain(null);
        })
        .finally(() => {
          handlerUpdateLoading(false);
        });
    } else {
      setChain(null);
      handlerUpdateLoading(false);
    }
  }, [genesisHash, handlerUpdateLoading]);

  return chain;
}
