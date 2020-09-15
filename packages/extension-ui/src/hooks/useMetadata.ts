// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Chain } from '@polkadot/extension-chains/types';

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
