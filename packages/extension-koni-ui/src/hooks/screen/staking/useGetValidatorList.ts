// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NominationPoolInfo, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { getInputValuesFromString } from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export type NominationPoolDataType = NominationPoolInfo & {
  symbol: string;
}

export type ValidatorDataType = ValidatorInfo & {
  symbol: string;
}

const useGetValidatorList = (chain: string, type: 'pool' | 'nominate') => {
  const { nominationPoolInfoMap, validatorInfoMap } = useSelector((state: RootState) => state.bonding);
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const chainInfo = chainInfoMap[chain];
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);
  const nominationPoolList = nominationPoolInfoMap[chain];
  const validatorList = validatorInfoMap[chain];

  return useMemo(() => {
    if (type === 'pool') {
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
  }, [decimals, nominationPoolList, symbol, type, validatorList]);
};

export default useGetValidatorList;
