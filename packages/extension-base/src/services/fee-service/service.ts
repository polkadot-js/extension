// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { calculateGasFeeParams } from '@subwallet/extension-base/services/fee-service/utils';
import { EvmFeeInfo } from '@subwallet/extension-base/types';
import { BehaviorSubject } from 'rxjs';

export default class FeeService {
  protected readonly state: KoniState;

  private evmFeeSubject: BehaviorSubject<Record<string, EvmFeeInfo>> = new BehaviorSubject<Record<string, EvmFeeInfo>>({});
  private useInfura: boolean;

  constructor (state: KoniState) {
    this.state = state;
    this.useInfura = true;
  }

  public changeMode (useInfura: boolean) {
    this.useInfura = useInfura;
  }

  private async updateFees () {
    await this.state.eventService.waitChainReady;
    const activeNetworks = this.state.activeNetworks;
    const chains = Object.values(activeNetworks).filter((chainInfo) => _isChainEvmCompatible(chainInfo)).map((chainInfo) => chainInfo.slug);

    const promises: Promise<void>[] = [];

    for (const chain of chains) {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
      const promise = new Promise<void>(async (resolve) => {
        const api = this.state.getEvmApi(chain);
        const result = await calculateGasFeeParams(api, chain, this.useInfura);

        this.updateChainFee(chain, result);

        resolve();
      });

      promises.push(promise);
    }

    await Promise.all(promises);
  }

  private updateChainFee (chain: string, info: EvmFeeInfo) {
    const rs: Record<string, EvmFeeInfo> = Object.assign({}, this.evmFeeSubject.getValue());

    rs[chain] = info;

    this.evmFeeSubject.next(rs);
  }

  public subscribeFees (callback: (data: Record<string, EvmFeeInfo>) => void) {
    let cancel = false;

    // eslint-disable-next-line prefer-const

    const fetchData = () => {
      this.updateFees().finally(() => {
        if (!cancel) {
          callback(this.evmFeeSubject.getValue());
        }
      });
    };

    fetchData();

    const interval = setInterval(() => {
      if (cancel) {
        clearInterval(interval);
      } else {
        fetchData();
      }
    }, 30 * 1000);

    return () => {
      cancel = true;
      clearInterval(interval);
    };
  }
}
