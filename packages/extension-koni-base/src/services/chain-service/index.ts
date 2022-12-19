// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainInfoMap } from '@subwallet/extension-koni-base/services/chain-list';
import { _ChainInfo, _DEFAULT_NETWORKS } from '@subwallet/extension-koni-base/services/chain-list/types';
import { EvmChainHandler } from '@subwallet/extension-koni-base/services/chain-service/handler/EvmChainHandler';
import { SubstrateChainHandler } from '@subwallet/extension-koni-base/services/chain-service/handler/SubstrateChainHandler';
import { _ChainState, _DataMap, ConnectionStatus } from '@subwallet/extension-koni-base/services/chain-service/types';
import { Subject } from 'rxjs';

import { logger as createLogger } from '@polkadot/util/logger';
import { Logger } from '@polkadot/util/types';

export class ChainService {
  private dataMap: _DataMap = {
    chainInfoMap: {},
    chainStateMap: {}
  };

  private substrateChainHandler: SubstrateChainHandler;
  private evmChainHandler: EvmChainHandler;

  private chainInfoMapSubject = new Subject<Record<string, _ChainInfo>>();
  private chainStateMapSubject = new Subject<Record<string, _ChainState>>();

  private logger: Logger;

  constructor () {
    this.dataMap.chainInfoMap = ChainInfoMap;
    Object.values(this.dataMap.chainInfoMap).forEach((chainInfo) => {
      this.dataMap.chainStateMap[chainInfo.slug] = {
        currentProvider: Object.keys(chainInfo.providers)[0],
        slug: chainInfo.slug,
        connectionStatus: ConnectionStatus.DISCONNECTED,
        active: false
      };
    });

    this.substrateChainHandler = new SubstrateChainHandler();
    this.evmChainHandler = new EvmChainHandler();

    this.chainInfoMapSubject.next(this.dataMap.chainInfoMap);
    this.chainStateMapSubject.next(this.dataMap.chainStateMap);

    this.logger = createLogger('chain-service');
  }

  public getChainInfoMapByKey (key: string) {
    return this.dataMap.chainInfoMap[key];
  }

  public initChainMap () {
    _DEFAULT_NETWORKS.forEach((slug) => {
      this.dataMap.chainStateMap[slug].active = true;
    });

    this.logger.log('Initiated with default networks');
  }

  public subscribeChainInfoMap () {
    return this.chainInfoMapSubject;
  }

  public subscribeChainStateMap () {
    return this.chainStateMapSubject;
  }

  public getChainInfoMap () {
    return this.dataMap.chainInfoMap;
  }

  public getChainStateMap () {
    return this.dataMap.chainStateMap;
  }

  public getActiveChains (): string[] {
    const activeChains: string[] = [];

    Object.values(this.dataMap.chainStateMap).forEach((chainState) => {
      if (chainState.active) {
        activeChains.push(chainState.slug);
      }
    });

    return activeChains;
  }

  public async validateCustomChain (provider: string, existedChainSlug?: string) {
    const substrateApi = this.substrateChainHandler.initApi('custom', provider);
    const evmApi = this.evmChainHandler.initApi('custom', provider);

    console.log(evmApi.api.eth.net.getId());

    return {
      decimals: 0,
      existentialDeposit: '',
      paraId: null,
      symbol: '',
      success: false,
      slug: '',
      genesisHash: '',
      addressPrefix: '',
      name: '',
      evmChainId: null
    };
  }

  private async getChainInfoByProvider (provider: string) {

  }
}
