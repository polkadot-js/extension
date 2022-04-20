// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { NETWORK_STATUS, NetWorkGroup } from '@polkadot/extension-base/background/KoniTypes';
import { RootState } from '@polkadot/extension-koni-ui/stores';

import { getAllNetworkMetadata } from '../messaging';
import { _getKnownHashes } from '../util/chains';
import useTranslation from './useTranslation';

export interface NetworkSelectOption {
  text: string;
  value: string;
  networkKey: string;
  networkPrefix: number;
  icon: string;
  groups: NetWorkGroup[];
  isEthereum: boolean;
  active: boolean;
  apiStatus: NETWORK_STATUS;
}

const RELAY_CHAIN = 'Relay Chain';

export default function (): NetworkSelectOption[] {
  const { t } = useTranslation();
  const [metadataChains, setMetadataChains] = useState<NetworkSelectOption[]>([]);
  const mounted = useRef(false);
  const { networkMap } = useSelector((state: RootState) => state);
  const parsedChains = _getKnownHashes(networkMap);
  const availableChains = parsedChains.filter((c) => c.isAvailable);

  // console.log('availableChains', availableChains);

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
            isEthereum: metadata.isEthereum,
            active: metadata.active,
            apiStatus: metadata.apiStatus
          }));

        setMetadataChains(res);
      }
    }).catch(console.error);

    return () => {
      mounted.current = false;
    };
  }, []);

  // console.log('metadataChains', metadataChains);

  return useMemo(() => [
    {
      text: t('Allow use on any chain'),
      value: '',
      networkKey: 'all',
      networkPrefix: -1,
      icon: 'polkadot',
      groups: ['UNKNOWN'] as NetWorkGroup[],
      isEthereum: false,
      active: true,
      apiStatus: NETWORK_STATUS.DISCONNECTED
    },
    // put the relay chains at the top
    ...availableChains.filter(({ chain }) => chain.includes(RELAY_CHAIN))
      .map(({ active, apiStatus, chain, genesisHash, groups, icon, isEthereum, networkKey, ss58Format }) => ({
        text: chain,
        value: genesisHash,
        networkPrefix: ss58Format,
        networkKey,
        icon,
        groups,
        isEthereum,
        active,
        apiStatus
      })),
    ...availableChains.map(({ active, apiStatus, chain, genesisHash, groups, icon, isEthereum, networkKey, ss58Format }) => ({
      text: chain,
      value: genesisHash,
      networkPrefix: ss58Format,
      networkKey,
      icon,
      groups,
      isEthereum,
      active,
      apiStatus
    }))
      // remove the relay chains, they are at the top already
      .filter(({ text }) => !text.includes(RELAY_CHAIN))
      .concat(
        // get any chain present in the metadata and not already part of chains
        ...metadataChains.filter(
          ({ value }) => {
            return !availableChains.find(
              ({ genesisHash }) => genesisHash === value);
          }
        ))
      .sort((a, b) => a.text.localeCompare(b.text))
  ], [availableChains, metadataChains, t]);
}
