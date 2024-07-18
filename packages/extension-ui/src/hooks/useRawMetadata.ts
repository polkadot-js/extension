// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0


import { useEffect, useState } from 'react';

import { getRawMetadata } from '../messaging.js';
import type { RawMetadataDef } from '@polkadot/extension-inject/types';

export default function useRawMetadata(genesisHash?: string | null): RawMetadataDef | null {
    const [rawMetadata, setRawMetadata] = useState<RawMetadataDef | null>(null);

    useEffect((): void => {
        if (genesisHash) {
            getRawMetadata(genesisHash)
                .then(setRawMetadata)
                .catch((error): void => {
                    console.error(error);
                    setRawMetadata(null);
                });
        } else {
            setRawMetadata(null);
        }
    }, [genesisHash]);

    return rawMetadata;
}
