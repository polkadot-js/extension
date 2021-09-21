// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo, useState } from 'react';

import { getAllMetatdata } from '../messaging';
import chains from '../util/chains';
import useTranslation from './useTranslation';

interface Option {
  text: string;
  value: string;
  chainType:"substrate" | "ethereum" |undefined
}

const RELAY_CHAIN = 'Relay Chain';

export default function (): Option[] {
  const { t } = useTranslation();
  const [metadataChains, setMetadatachains] = useState<Option[]>([]);

  useEffect(() => {
    getAllMetatdata().then((metadataDefs) => {
      console.log("metadataDefs",metadataDefs)
      const res = metadataDefs.map((metadata) => ({ text: metadata.chain, value: metadata.genesisHash, chainType:metadata.chainType||'substrate' }));

      setMetadatachains(res);
    }).catch(console.error);
  }, []);

  const hashes = useMemo(() => [
    {
      text: t('Allow use on any chain'),
      value: '',
      chainType:undefined
    },
    // put the relay chains at the top
    ...chains.filter(({ chain }) => chain.includes(RELAY_CHAIN))
      .map(({ chain, genesisHash,chainType }) => ({
        text: chain,
        value: genesisHash,
        chainType
      })),
    ...chains.map(({ chain, genesisHash, chainType }) => ({
      text: chain,
      value: genesisHash,
      chainType
    }))
      // remove the relay chains, they are at the top already
      .filter(({ text }) => !text.includes(RELAY_CHAIN))
      .concat(
      // get any chain present in the metadata and not already part of chains
        ...metadataChains.filter(
          ({ value }) => {
            return !chains.find(
              ({ genesisHash }) => genesisHash === value);
          }
        ))
      .sort((a, b) => a.text.localeCompare(b.text))
  ], [metadataChains, t]);

  return hashes;
}
