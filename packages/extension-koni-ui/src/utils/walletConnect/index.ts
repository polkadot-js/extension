// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { _getSubstrateGenesisHash } from '@subwallet/extension-base/services/chain-service/utils';
import {
  WALLET_CONNECT_EIP155_NAMESPACE,
  WALLET_CONNECT_POLKADOT_NAMESPACE
} from '@subwallet/extension-base/services/wallet-connect-service/constants';
import { findChainInfoByChainId } from '@subwallet/extension-koni-ui/utils';
import { WalletConnectChainInfo } from '@subwallet/extension-koni-ui/types';

export const findChainInfoByHalfGenesisHash = (chainMap: Record<string, _ChainInfo>, halfGenesisHash?: string): _ChainInfo | null => {
  if (!halfGenesisHash) {
    return null;
  }

  for (const chainInfo of Object.values(chainMap)) {
    if (_getSubstrateGenesisHash(chainInfo)?.toLowerCase().substring(2, 2 + 32) === halfGenesisHash.toLowerCase()) {
      return chainInfo;
    }
  }

  return null;
};

export const chainsToWalletConnectChainInfos = (chainMap: Record<string, _ChainInfo>, chains: string[]): Array<WalletConnectChainInfo> => {
  return chains.map((chain) => {
    const [namespace, info] = chain.split(':');
    if (namespace === WALLET_CONNECT_EIP155_NAMESPACE) {
      const chainInfo = findChainInfoByChainId(chainMap, parseInt(info));
      return {
        chainInfo,
        slug: chainInfo?.slug || chain
      };
    } else if (namespace === WALLET_CONNECT_POLKADOT_NAMESPACE) {
      const chainInfo = findChainInfoByHalfGenesisHash(chainMap, info);
      return {
        chainInfo,
        slug: chainInfo?.slug || chain
      };
    } else {
      return {
        chainInfo: null,
        slug: chain
      };
    }
  });
}
