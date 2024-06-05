// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ExtrinsicDataTypeMap, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { _getBlockExplorerFromChain, _isChainTestNet, _isPureEvmChain } from '@subwallet/extension-base/services/chain-service/utils';
import { CHAIN_FLIP_MAINNET_EXPLORER, CHAIN_FLIP_TESTNET_EXPLORER } from '@subwallet/extension-base/services/swap-service/utils';
import { ChainflipSwapTxData } from '@subwallet/extension-base/types/swap';

// @ts-ignore
export function parseTransactionData<T extends ExtrinsicType> (data: unknown): ExtrinsicDataTypeMap[T] {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return data as ExtrinsicDataTypeMap[T];
}

function getBlockExplorerAccountRoute (explorerLink: string) {
  if (explorerLink.includes('explorer.subspace.network')) {
    return 'accounts';
  }

  if (explorerLink.includes('deeperscan.io')) {
    return 'account';
  }

  if (explorerLink.includes('subscan.io')) {
    return 'account';
  }

  if (explorerLink.includes('3dpscan.io')) {
    return 'account';
  }

  if (explorerLink.includes('explorer.polimec.org')) {
    return 'account';
  }

  if (explorerLink.includes('invarch.statescan.io')) {
    return '#/accounts';
  }

  return 'address';
}

function getBlockExplorerTxRoute (chainInfo: _ChainInfo) {
  if (_isPureEvmChain(chainInfo)) {
    return 'tx';
  }

  if (['aventus', 'deeper_network'].includes(chainInfo.slug)) {
    return 'transaction';
  }

  if (['invarch'].includes(chainInfo.slug)) {
    return '#/extrinsics';
  }

  return 'extrinsic';
}

export function getExplorerLink (chainInfo: _ChainInfo, value: string, type: 'account' | 'tx'): string | undefined {
  const explorerLink = _getBlockExplorerFromChain(chainInfo);

  if (explorerLink && type === 'account') {
    const route = getBlockExplorerAccountRoute(explorerLink);

    return `${explorerLink}${explorerLink.endsWith('/') ? '' : '/'}${route}/${value}`;
  }

  if (explorerLink && value.startsWith('0x')) {
    const route = getBlockExplorerTxRoute(chainInfo);

    return (`${explorerLink}${explorerLink.endsWith('/') ? '' : '/'}${route}/${value}`);
  }

  return undefined;
}

export function getChainflipExplorerLink (data: ChainflipSwapTxData, chainInfo: _ChainInfo) {
  const chainflipDomain = _isChainTestNet(chainInfo) ? CHAIN_FLIP_TESTNET_EXPLORER : CHAIN_FLIP_MAINNET_EXPLORER;

  return `${chainflipDomain}/channels/${data.depositChannelId}`;
}
