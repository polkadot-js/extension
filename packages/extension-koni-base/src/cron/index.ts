// Copyright 2019-2021 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Subject } from 'rxjs';

import { CRON_REFRESH_PRICE_INTERVAL } from '@polkadot/extension-koni-base/constants';
import { refreshPrice } from '@polkadot/extension-koni-base/cron/price';

export class KoniCron {
  private cronMap: Record<string, any> = {};
  private subjectMap: Record<string, Subject<any>> = {};

  getCron (name: string): any {
    return this.cronMap[name];
  }

  getSubjectMap (name: string): any {
    return this.subjectMap[name];
  }

  addCron (name: string, callback: () => void, interval: number) {
    callback();

    this.cronMap[name] = setInterval(callback, interval);
  }

  addSubscribeCron<T> (name: string, callback: (subject: Subject<T>) => void, interval: number) {
    const sb = new Subject<T>();

    callback(sb);
    this.subjectMap[name] = sb;
    this.cronMap[name] = setInterval(callback, interval);
  }

  removeCron (name: string) {
    const interval = this.cronMap[name] as number;

    if (interval) {
      clearInterval(interval);
      delete this.cronMap[name];
    }
  }

  init () {
    this.addCron('refreshPrice', refreshPrice, CRON_REFRESH_PRICE_INTERVAL);
  }
}
