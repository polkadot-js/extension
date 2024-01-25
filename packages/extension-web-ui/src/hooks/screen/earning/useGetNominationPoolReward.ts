// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { useMemo } from 'react';

export default function useGetNominationPoolReward (address?: string, chain?: string) {
  const stakingRewardMap = useSelector((state: RootState) => state.staking.stakingRewardMap);

  return useMemo(() => {
    return stakingRewardMap.find((item) => item.address === address && item.chain === chain && item.type === StakingType.POOLED);
  }, [address, chain, stakingRewardMap]);
}
