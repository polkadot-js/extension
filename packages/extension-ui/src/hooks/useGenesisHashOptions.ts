// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo, useState } from 'react';

import { getAllMetadata } from '../messaging';
import chains from '../util/chains';

interface Option {
  text: string;
  value: string;
}

interface ChainsReduce {
  alephChains: Option[];
  relayChains: Option[];
  otherChains: Option[];
}

const RELAY_CHAIN = 'Relay Chain';
const ALEPH_ZERO = 'Aleph Zero';

export default function (): Option[] {
  const [metadataChains, setMetadatachains] = useState<Option[]>([]);

  useEffect(() => {
    getAllMetadata()
      .then((metadataDefs) => {
        const res = metadataDefs.map((metadata) => ({ text: metadata.chain, value: metadata.genesisHash }));

        setMetadatachains(res);
      })
      .catch(console.error);
  }, []);

  const hashes = useMemo(() => {
    const { alephChains, otherChains, relayChains } = chains.reduce<ChainsReduce>(
      (acc, { chain, genesisHash }) => {
        if (chain.includes(ALEPH_ZERO)) {
          return {
            ...acc,
            alephChains: [...acc.alephChains, { text: chain, value: genesisHash }]
          };
        } else if (chain.includes(RELAY_CHAIN)) {
          return {
            ...acc,
            relayChains: [...acc.relayChains, { text: chain, value: genesisHash }]
          };
        } else {
          return {
            ...acc,
            otherChains: [...acc.otherChains, { text: chain, value: genesisHash }]
          };
        }
      },
      { alephChains: [], relayChains: [], otherChains: [] }
    );

    const newChains = [...alephChains, ...relayChains, ...otherChains];

    const extraChains = metadataChains.filter(({ value }) => {
      return !chains.find(({ genesisHash }) => genesisHash === value);
    });

    return [...newChains, ...extraChains];
  }, [metadataChains]);

  return hashes;
}
