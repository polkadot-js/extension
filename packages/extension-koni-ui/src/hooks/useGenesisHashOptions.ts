// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo, useRef, useState } from 'react';

import { NetWorkGroup } from '@polkadot/extension-base/background/KoniTypes';

import { getAllNetworkMetadata } from '../messaging';
import chains from '../util/chains';
import useTranslation from './useTranslation';

export default interface networkSelectOption {
  text: string;
  value: string;
  networkKey: string;
  networkPrefix: number;
  icon: string;
  groups: NetWorkGroup[];
  isEthereum: boolean;
}

const RELAY_CHAIN = 'Relay Chain';

const availableChain = chains.filter((c) => c.isAvailable);

export default function (): networkSelectOption[] {
  const { t } = useTranslation();
  const [metadataChains, setMetadataChains] = useState<networkSelectOption[]>([]);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;

    getAllNetworkMetadata().then((metadataDefs) => {
      if (mounted.current) {
        const res = metadataDefs.filter((c) => c.isAvailable).map((metadata) => (
          {
            text: metadata.chain,
            value: metadata.genesisHash,
            networkKey: metadata.networkKey,
            networkPrefix: metadata.ss58Format,
            icon: metadata.icon,
            groups: metadata.groups,
            isEthereum: metadata.isEthereum
          }));

        setMetadataChains(res);
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
      icon: 'polkadot',
      groups: ['UNKNOWN'] as NetWorkGroup[],
      isEthereum: false
    },
    // put the relay chains at the top
    ...availableChain.filter(({ chain }) => chain.includes(RELAY_CHAIN))
      .map(({ chain, genesisHash, groups, icon, isEthereum, networkKey, ss58Format }) => ({
        text: chain,
        value: genesisHash,
        networkPrefix: ss58Format,
        networkKey,
        icon,
        groups,
        isEthereum
      })),
    ...availableChain.map(({ chain, genesisHash, groups, icon, isEthereum, networkKey, ss58Format }) => ({
      text: chain,
      value: genesisHash,
      networkPrefix: ss58Format,
      networkKey,
      icon,
      groups,
      isEthereum
    }))
      // remove the relay chains, they are at the top already
      .filter(({ text }) => !text.includes(RELAY_CHAIN))
      .concat(
        // get any chain present in the metadata and not already part of chains
        ...metadataChains.filter(
          ({ value }) => {
            return !availableChain.find(
              ({ genesisHash }) => genesisHash === value);
          }
        ))
      .sort((a, b) => a.text.localeCompare(b.text))
  ], [metadataChains, t]);

  return hashes;
}
