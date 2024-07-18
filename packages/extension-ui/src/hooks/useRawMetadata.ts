// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';

import { getRawMetadata } from '../messaging.js';
import type { HexString } from '@polkadot/util/types';

export default function useRawMetadata (genesisHash?: string | null): HexString | null {
  const [raw, setRaw] = useState<HexString | null>(null);

  useEffect((): void => {
    if (genesisHash) {
      getRawMetadata(genesisHash)
        .then(setRaw)
        .catch((error): void => {
          console.error(error);
          setRaw(null);
        });
    } else {
        setRaw(null);
    }
  }, [genesisHash]);

  return raw;
}
