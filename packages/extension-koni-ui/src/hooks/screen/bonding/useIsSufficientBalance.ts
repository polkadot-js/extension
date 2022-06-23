// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState } from '@subwallet/extension-base/background/KoniTypes';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export default function useIsSufficientBalance (networkKey: string, minBond: number | undefined) {
  const { balance: { details: balanceMap }, networkMap } = useSelector((state: RootState) => state);

  if (!minBond) {
    return false;
  }

  let result = false;

  for (const [_networkKey, balanceObj] of Object.entries(balanceMap)) {
    if (_networkKey === networkKey) {
      if (balanceObj.state !== APIItemState.READY) {
        break;
      } else {
        const freeBalance = (parseFloat(balanceObj.free || '0') - parseFloat(balanceObj.miscFrozen || '0')) / (10 ** (networkMap[networkKey].decimals as number));

        if (freeBalance > minBond) {
          result = true;
        }
      }

      break;
    }
  }

  return result;
}
