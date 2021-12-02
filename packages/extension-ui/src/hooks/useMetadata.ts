// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Chain } from '@polkadot/extension-chains/types';

import { useEffect, useState } from 'react';

import { getMetadata } from '../messaging';

export default function useMetadata (genesisHash?: string | null, isPartial?: boolean): Chain | null {
  const [chain, setChain] = useState<Chain | null>(null);

  useEffect((): void => {
    if (genesisHash) {
      getMetadata(genesisHash, isPartial)
        .then(setChain)
        .catch((error): void => {
          console.error(error);
          setChain(null);
        });
    } else {
      setChain(null);
    }
  }, [genesisHash, isPartial]);

  return chain;
}
