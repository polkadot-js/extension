// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo, useRef, useState } from 'react';

import { getAllNetworkMetadata } from '../messaging';
import chains from '../util/chains';
import useTranslation from './useTranslation';

export default interface networkSelectOption {
  text: string;
  value: string;
  networkKey: string;
  networkPrefix: number;
  icon: string;
  group: string;
  isEthereum: boolean;
}

const RELAY_CHAIN = 'Relay Chain';

export default function (): networkSelectOption[] {
  const { t } = useTranslation();
  const [metadataChains, setMetadatachains] = useState<networkSelectOption[]>([]);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;

    getAllNetworkMetadata().then((metadataDefs) => {
      if (mounted.current) {
        const res = metadataDefs.map((metadata) => (
          {
            text: metadata.chain,
            value: metadata.genesisHash,
            networkKey: metadata.networkKey,
            networkPrefix: metadata.ss58Format,
            icon: metadata.icon,
            group: metadata.group,
            isEthereum: metadata.isEthereum
          }));

        setMetadatachains(res);
      }
    }).catch(console.error);

    return () => {
      mounted.current = false;
    };
  }, []);

  const hashes = useMemo(() => [
    {
      text: t('Allow use on any chain'),
      value: '',
      networkKey: 'all',
      networkPrefix: -1,
      icon: 'substrate',
      group: '',
      isEthereum: false
    },
    // put the relay chains at the top
    ...chains.filter(({ chain }) => chain.includes(RELAY_CHAIN))
      .map(({ chain, genesisHash, group, icon, isEthereum, networkKey, ss58Format }) => ({
        text: chain,
        value: genesisHash,
        networkPrefix: ss58Format,
        networkKey,
        icon,
        group,
        isEthereum
      })),
    ...chains.map(({ chain, genesisHash, group, icon, isEthereum, networkKey, ss58Format }) => ({
      text: chain,
      value: genesisHash,
      networkPrefix: ss58Format,
      networkKey,
      icon,
      group,
      isEthereum
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
