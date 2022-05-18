// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NETWORK_STATUS, NetWorkGroup } from '@subwallet/extension-base/background/KoniTypes';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { _getKnownHashes } from '../util/defaultChains';
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
  const { networkMap } = useSelector((state: RootState) => state);
  const parsedChains = _getKnownHashes(networkMap);

  const availableChains = parsedChains.filter((c) => c.isAvailable);

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
      .sort((a, b) => a.text.localeCompare(b.text))
  ], [availableChains, t]);
}
