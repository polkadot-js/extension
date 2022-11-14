// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { ScannerContext } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { getNetworkJsonByInfo } from '@subwallet/extension-koni-ui/util/getNetworkJsonByGenesisHash';
import { useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { isEthereumAddress } from '@polkadot/util-crypto';

interface ResultProps {
  network: NetworkJson | null;
  loading: boolean
}

export const useGetNetworkQrRequest = (): ResultProps => {
  const { networkMap } = useSelector((state: RootState) => state);

  const { state: { evmChainId, genesisHash, isEthereumStructure, senderAddress } } = useContext(ScannerContext);

  return useMemo((): ResultProps => {
    const info: undefined | number | string = isEthereumStructure ? evmChainId : genesisHash;
    const network = getNetworkJsonByInfo(networkMap, isEthereumAddress(senderAddress || ''), isEthereumStructure, info);

    return {
      loading: !network,
      network: network
    };
  }, [isEthereumStructure, evmChainId, genesisHash, networkMap, senderAddress]);
};
