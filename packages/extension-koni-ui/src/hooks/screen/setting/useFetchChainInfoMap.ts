// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export default function useFetchChainInfoMap () {
  const currentAccount = useSelector((state: RootState) => state.currentAccount);
  const chainInfoMap = useSelector((state: RootState) => state.chainInfoMap);

  return { chainInfoMap, isEthereum: currentAccount?.account?.type === 'ethereum' };
}
