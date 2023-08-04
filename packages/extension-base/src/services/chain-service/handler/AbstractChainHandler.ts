// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _ApiOptions } from '@subwallet/extension-base/services/chain-service/handler/types';
import { _ChainBaseApi, _ChainConnectionStatus } from '@subwallet/extension-base/services/chain-service/types';
import { BehaviorSubject } from 'rxjs';

const MAX_RECOVER_RETRY = 6;

export const FIRST_RECONNECT_TIME = 3000;
export const SHORT_RETRY_TIME = 20000;
// export const LONG_RETRY_TIME = 60000;

interface RetryObject {
  retryTimes: number;
  timeout?: NodeJS.Timer;
}

export abstract class AbstractChainHandler {
  readonly apiStateMapSubject = new BehaviorSubject<Record<string, _ChainConnectionStatus>>({});
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

  handleConnection (chain: string, newStatus: _ChainConnectionStatus, forceRecover = false): void {
    const currentMap = this.apiStateMapSubject.getValue();
    const oldStatus = currentMap[chain];

    // Update api state
    if (oldStatus !== newStatus) {
      this.apiStateMapSubject.next({
        ...currentMap,
        [chain]: newStatus
      });
    }

    // Reset retry when connected is successful
    if (newStatus === _ChainConnectionStatus.CONNECTED) {
      this.cancelRecover(chain);
    }

    // Handle connection change
    if ((!this.isRecovering(chain) || forceRecover) && newStatus === _ChainConnectionStatus.DISCONNECTED) {
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

    if (retryTimes >= MAX_RECOVER_RETRY) {
      this.handleConnection(chain, _ChainConnectionStatus.UNSTABLE);
      this.cancelRecover(chain); // Need manual recover
    }

    // Slow down recover frequency if increasing recover times
    const retryTimeout = retryTimes === 0 ? FIRST_RECONNECT_TIME : SHORT_RETRY_TIME;

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

  protected isRecovering (chain: string): boolean {
    return !!this.recoverMap[chain];
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
