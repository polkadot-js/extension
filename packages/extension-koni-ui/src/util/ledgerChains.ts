// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { LedgerNetwork } from '@subwallet/extension-base/background/KoniTypes';
import { PredefinedLedgerNetwork } from '@subwallet/extension-koni-ui/constants/ledger';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export function useGetSupportedLedger (): LedgerNetwork[] {
  const { chainInfoMap, chainStateMap } = useSelector((state: RootState) => state.chainStore);

  const supportedLedgerNetwork = [...PredefinedLedgerNetwork];

  // Find active network items
  const activeNetworkItem = Object.keys(chainInfoMap).reduce((result, key) => {
    const chainInfo = chainInfoMap[key];
    const chainState = chainStateMap[key];

    if (chainState?.active && chainInfo.substrateInfo?.genesisHash) {
      result[chainInfo.substrateInfo.genesisHash] = chainInfo;
    }

    return result;
  }, {} as Record<string, _ChainInfo>);

  // Fill display name of ledger network with active network item name
  supportedLedgerNetwork.forEach((ledgerNetwork) => {
    const activeNetwork = activeNetworkItem[ledgerNetwork.genesisHash];

    if (activeNetwork) {
      ledgerNetwork.displayName = activeNetwork.name;
    }
  });

  return supportedLedgerNetwork;
}
