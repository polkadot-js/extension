// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from 'react-redux';

import { APIItemState, StakingItem } from '@polkadot/extension-base/background/KoniTypes';
import { StakingType } from '@polkadot/extension-koni-ui/hooks/screen/home/types';
import { RootState } from '@polkadot/extension-koni-ui/stores';

export default function useFetchStaking (): StakingType {
  const { staking: stakingReducer } = useSelector((state: RootState) => state);

  // console.log('fetch staking from state');
  const stakingItemMap = stakingReducer.details;
  const readyStakingItems: StakingItem[] = [];

  Object.keys(stakingItemMap).forEach((key) => {
    const stakingItem = stakingItemMap[key];

    if (stakingItem.state === APIItemState.READY) {
      readyStakingItems.push(stakingItem);
    }
  });

  return {
    data: readyStakingItems
  } as StakingType;
}
