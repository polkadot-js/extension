// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

export interface ChainOptions {
  text: string;
  value: string;
}

export default function useGetActiveChains () {
  const networkMap = useSelector((state: RootState) => state.networkMap);
  const result: ChainOptions[] = [];

  for (const [key, network] of Object.entries(networkMap)) {
    if (network.active && key !== 'polkadot' && key !== 'kusama') {
      result.push({
        text: network.chain,
        value: key
      });
    }
  }

  if (result.length === 0) {
    return [{
      text: 'Please enable at least 1 network',
      value: ''
    }];
  }

  return result;
}
