// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export default function useGetFreeBalance (networkKey: string) {
  const { balance: { details: balanceMap } } = useSelector((state: RootState) => state);

  return (parseFloat(balanceMap[networkKey].free || '0') - parseFloat(balanceMap[networkKey].feeFrozen || '0')).toString();
}
