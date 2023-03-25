// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainStakingMetadata } from '@subwallet/extension-base/background/KoniTypes';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function useGetChainStakingMetadata (chain?: string) {
  const chainStakingMetadataList = useSelector((state: RootState) => state.staking.chainStakingMetadataList);

  return useMemo(() => {
    if (!chain) {
      return;
    }

    let result: ChainStakingMetadata | undefined;

    for (const chainMetadata of chainStakingMetadataList) {
      if (chainMetadata.chain === chain) {
        result = chainMetadata;
      }
    }

    return result;
  }, [chain, chainStakingMetadataList]);
}
