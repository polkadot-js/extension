// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ResponseFindRawMetadata } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';

import { Metadata, TypeRegistry } from '@polkadot/types';
import { ChainProperties } from '@polkadot/types/interfaces';
import { Registry } from '@polkadot/types/types';
import { HexString } from '@polkadot/util/types';

export const createRegistry = (chain: _ChainInfo, data: ResponseFindRawMetadata): Registry => {
  const registry: Registry = new TypeRegistry();
  const metadata = new Metadata(registry, data.rawMetadata as HexString);
  const tokenInfo = _getChainNativeTokenBasicInfo(chain);

  registry.register(data.types);
  registry.setMetadata(metadata, undefined, data.userExtensions);
  registry.setChainProperties(registry.createType('ChainProperties', {
    ss58Format: chain.substrateInfo?.addressPrefix || 42,
    tokenDecimals: tokenInfo.decimals,
    tokenSymbol: tokenInfo.symbol
  }) as unknown as ChainProperties);

  return registry;
};
