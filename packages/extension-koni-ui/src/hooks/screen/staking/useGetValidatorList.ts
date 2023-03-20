// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NominationPoolInfo, StakingType, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { getInputValuesFromString } from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import useFetchChainInfo from '@subwallet/extension-koni-ui/hooks/screen/common/useFetchChainInfo';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export type NominationPoolDataType = NominationPoolInfo & {
  symbol: string;
}

export type ValidatorDataType = ValidatorInfo & {
  symbol: string;
}

const useGetValidatorList = (chain: string, type: StakingType) => {
  const { nominationPoolInfoMap, validatorInfoMap } = useSelector((state: RootState) => state.bonding);
  const chainInfo = useFetchChainInfo(chain);

  return useMemo(() => {
    if (!chainInfo) {
      return [];
    }

    const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

    if (type === StakingType.POOLED) {
      const nominationPoolList = nominationPoolInfoMap[chain];
      const result: NominationPoolDataType[] = [];

      if (nominationPoolList) {
        nominationPoolList.forEach((item) => {
          const transformBondedAmount = getInputValuesFromString(item.bondedAmount, decimals);

          const nominationPoolItem: NominationPoolDataType = {
            ...item,
            bondedAmount: transformBondedAmount,
            symbol
          };

          result.push(nominationPoolItem);
        });
      }

      return result;
    } else {
      const validatorList = validatorInfoMap[chain];
      const result: ValidatorDataType[] = [];

      if (validatorList) {
        validatorList.forEach((item) => {
          const transformMinBond = getInputValuesFromString(item.minBond, decimals);
          const transformOwnStake = getInputValuesFromString(item.ownStake, decimals);
          const transformOtherStake = getInputValuesFromString(item.otherStake, decimals);
          const transformTotalStake = getInputValuesFromString(item.totalStake, decimals);

          const validatorItem: ValidatorDataType = {
            ...item,
            minBond: transformMinBond,
            ownStake: transformOwnStake,
            otherStake: transformOtherStake,
            totalStake: transformTotalStake,
            symbol
          };

          result.push(validatorItem);
        });
      }

      return result;
    }
  }, [chain, chainInfo, nominationPoolInfoMap, type, validatorInfoMap]);
};

export default useGetValidatorList;
