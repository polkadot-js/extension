// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainStakingMetadata, NominatorMetadata } from '@subwallet/extension-base/background/KoniTypes';
import useGetStakingList from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetStakingList';
import { useMemo } from 'react';

export const useGetStakeData = (address: string, type: string, defaultChainStakingMetadata?: ChainStakingMetadata, defaultNominatorMetadata?: NominatorMetadata, slug?: string) => {
  const { data } = useGetStakingList();

  return useMemo(() => {
    if (slug) {
      const chain = slug.split('-')[0];
      const matchedItem = data.find((item) => item.staking.chain === chain && item.staking.address === address && item.staking.type === type);

      if (matchedItem) {
        return {
          _chainStakingMetadata: matchedItem.chainStakingMetadata,
          _nominatorMetadata: matchedItem.nominatorMetadata,
          slug
        };
      } else {
        return {
          _chainStakingMetadata: defaultChainStakingMetadata,
          _nominatorMetadata: defaultNominatorMetadata,
          slug
        };
      }
    } else {
      return {
        _chainStakingMetadata: defaultChainStakingMetadata,
        _nominatorMetadata: defaultNominatorMetadata,
        slug: ''
      };
    }
  }, [address, data, defaultChainStakingMetadata, defaultNominatorMetadata, slug, type]);
};
