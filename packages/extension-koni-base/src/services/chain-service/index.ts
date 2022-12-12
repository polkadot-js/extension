// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainInfoMap } from '@subwallet/extension-koni-base/services/chain-list';
import { _ChainInfo, _DEFAULT_NETWORKS } from '@subwallet/extension-koni-base/services/chain-list/types';
import { _DataMap } from '@subwallet/extension-koni-base/services/chain-service/types';
import { Subject } from 'rxjs';

import { logger as createLogger } from '@polkadot/util/logger';
import { Logger } from '@polkadot/util/types';

export class ChainService {
  private dataMap: _DataMap = {
    chainInfoMap: {},
    chainStateMap: {}
  };

  private chainInfoSubject = new Subject<Record<string, _ChainInfo>>();

  private logger: Logger;

  constructor () {
    this.dataMap.chainInfoMap = ChainInfoMap;

    this.chainInfoSubject.next(this.getChainInfoMap());

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

  public subscribeChainInfo () {
    return this.chainInfoSubject;
  }

  public getChainInfoMap () {
    return this.dataMap.chainInfoMap;
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
}
