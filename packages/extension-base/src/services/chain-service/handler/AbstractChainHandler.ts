// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _ApiOptions } from '@subwallet/extension-base/services/chain-service/handler/types';
import { _ChainBaseApi } from '@subwallet/extension-base/services/chain-service/types';
import { BehaviorSubject } from 'rxjs';

const SHORT_RECOVER_RETRY = 3;

export const FIRST_RECONNECT_TIME = 3000;
export const SHORT_RETRY_TIME = 15000;
export const LONG_RETRY_TIME = 60000;

interface RetryObject {
  retryTimes: number;
  timeout?: NodeJS.Timer;
}

export abstract class AbstractChainHandler {
  readonly apiStateMapSubject = new BehaviorSubject<Record<string, boolean>>({});
  // Recover retry times
  protected recoverMap: Record<string, RetryObject>;
  protected isSleeping = false;

  protected constructor (protected parent?: ChainService) {
    this.recoverMap = {};
  }

  abstract getApiByChain (chain: string): _ChainBaseApi | undefined;
  abstract initApi (chainSlug: string, apiUrl: string, options: Omit<_ApiOptions, 'metadata'>): Promise<_ChainBaseApi>;
  abstract recoverApi (chainSlug: string): void;
  abstract sleep (): Promise<void>;
  abstract wakeUp (): Promise<void>;

  handleConnect (chain: string, isConnected: boolean): void {
    const currentMap = this.apiStateMapSubject.getValue();
    const currentStatus = currentMap[chain];

    // Update api state
    if (currentStatus !== isConnected) {
      this.apiStateMapSubject.next({
        ...currentMap,
        [chain]: isConnected
      });
    }

    // Handle connection change
    if (!isConnected) {
      this.handleRecover(chain);
    }
  }

  // Recover api if it is disconnected
  protected handleRecover (chain: string): void {
    // Not recover inactive chain
    if (!this.parent?.getChainStateByKey(chain)?.active) {
      this.cancelRecover(chain);

      return;
    }

    // Get retry record
    const retryRecord: RetryObject = this.recoverMap[chain] || { retryTimes: 0 };

    clearTimeout(retryRecord.timeout);

    const retryTimes = retryRecord.retryTimes;
    // Slow down recover frequency if increasing recover times
    const retryTimeout = retryTimes === 0 ? FIRST_RECONNECT_TIME : (retryTimes >= SHORT_RECOVER_RETRY ? LONG_RETRY_TIME : SHORT_RETRY_TIME);

    // Recover api after retry timeout
    const timeout = setTimeout(() => {
      if (this.getApiByChain(chain)?.isApiConnected || this.isSleeping) {
        // Cancel recover if api is connected
        this.cancelRecover(chain);
      } else {
        this.recoverApi(chain);
        this.handleRecover(chain); // This will be cancel if api is connected
      }
    }, retryTimeout);

    this.recoverMap[chain] = { ...retryRecord, retryTimes: retryTimes + 1, timeout };
  }

  protected cancelRecover (chain: string): void {
    const retryRecord = this.recoverMap[chain];

    if (retryRecord) {
      clearTimeout(retryRecord.timeout);
      delete this.recoverMap[chain];
    }
  }

  cancelAllRecover (): void {
    Object.keys(this.recoverMap).forEach((chain) => {
      this.cancelRecover(chain);
    });
  }
}
