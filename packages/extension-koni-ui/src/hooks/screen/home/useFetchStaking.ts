// [object Object]
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from 'react-redux';

import { StakingType } from '@polkadot/extension-koni-ui/hooks/screen/home/types';
import { RootState } from '@polkadot/extension-koni-ui/stores';

export default function useFetchStaking (): StakingType {
  const { staking: stakingReducer } = useSelector((state: RootState) => state);

  // console.log('fetch staking from state');

  return {
    loading: !stakingReducer.ready,
    data: stakingReducer
  } as StakingType;
}
