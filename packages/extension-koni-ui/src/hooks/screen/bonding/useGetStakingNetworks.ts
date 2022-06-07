// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { useSelector } from 'react-redux';

import { isEthereumAddress } from '@polkadot/util-crypto';

export default function useGetStakingNetworks () {
  const { currentAccount: { account: currentAccount }, networkMap } = useSelector((state: RootState) => state);
  const isEthAccount = isEthereumAddress(currentAccount?.address);
  const result: NetworkJson[] = [];

  for (const network of Object.values(networkMap)) {
    if (isEthAccount) {
      if (network.supportBonding && network.isEthereum && network.active) {
        result.push(network);
      }
    } else {
      if (network.supportBonding && !network.isEthereum && network.active) {
        result.push(network);
      }
    }
  }

  return result;
}
