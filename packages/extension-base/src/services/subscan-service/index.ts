// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { SWError } from '@subwallet/extension-base/background/errors/SWError';
import { CrowdloanContributionsResponse, ExtrinsicItem, ExtrinsicsListResponse, IMultiChainBalance, SubscanRequest, SubscanResponse, TransferItem, TransfersListResponse } from '@subwallet/extension-base/services/subscan-service/types';
import { wait } from '@subwallet/extension-base/utils';
import fetch from 'cross-fetch';

const QUERY_ROW = 100;

export class SubscanService {
  private limitRate = 2; // limit per interval check
  private intervalCheck = 1000; // interval check in ms
  private maxRetry = 9; // interval check in ms
  private requestMap: Record<number, SubscanRequest<any>> = {};
  private nextId = 0;
  private isRunning = false;
  private getId () {
    return this.nextId++;
  }

  constructor (private subscanChainMap: Record<string, string>, options?: {limitRate?: number, intervalCheck?: number, maxRetry?: number}) {
    this.limitRate = options?.limitRate || this.limitRate;
    this.intervalCheck = options?.intervalCheck || this.intervalCheck;
    this.maxRetry = options?.maxRetry || this.maxRetry;
  }

  private getApiUrl (chain: string, path: string) {
    const subscanChain = this.subscanChainMap[chain];

    if (!subscanChain) {
      throw new SWError('NOT_SUPPORTED', 'Chain is not supported');
    }

    return `https://${subscanChain}.api.subscan.io/${path}`;
  }

  private postRequest (url: string, body: any) {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }

  private addRequest<T> (run: SubscanRequest<T>['run']) {
    const newId = this.getId();

    return new Promise<T>((resolve, reject) => {
      this.requestMap[newId] = {
        id: newId,
        status: 'pending',
        retry: -1,
        run,
        resolve,
        reject
      };

      if (!this.isRunning) {
        this.process();
      }
    });
  }

  private process () {
    this.isRunning = true;
    const maxRetry = this.maxRetry;

    const interval = setInterval(() => {
      const remainingRequests = Object.values(this.requestMap);

      if (remainingRequests.length === 0) {
        this.isRunning = false;
        clearInterval(interval);

        return;
      }

      // Get first this.limit requests base on id
      const requests = remainingRequests
        .filter((request) => request.status !== 'running')
        .sort((a, b) => a.id - b.id)
        .slice(0, this.limitRate);

      // Start requests
      requests.forEach((request) => {
        request.status = 'running';
        request.run().then((rs) => {
          request.resolve(rs);
        }).catch((e) => {
          if (request.retry < maxRetry) {
            request.status = 'pending';
            request.retry++;
          } else {
            // Reject request
            request.reject(new SWError('MAX_RETRY', String(e)));
          }
        });
      });
    }, this.intervalCheck);
  }

  public checkSupportedSubscanChain (chain: string): boolean {
    return !!this.subscanChainMap[chain];
  }

  public setSubscanChainMap (subscanChainMap: Record<string, string>) {
    this.subscanChainMap = subscanChainMap;
  }

  // Implement Subscan API
  public getMultiChainBalance (address: string): Promise<IMultiChainBalance[]> {
    return this.addRequest(async () => {
      const rs = await this.postRequest(this.getApiUrl('polkadot', 'api/scan/multiChain/account'), { address });

      if (rs.status !== 200) {
        throw new SWError('SubscanService.getMultiChainBalance', await rs.text());
      }

      const jsonData = (await rs.json()) as SubscanResponse<IMultiChainBalance[]>;

      return jsonData.data;
    });
  }

  public getCrowdloanContributions (relayChain: string, address: string, page = 0): Promise<CrowdloanContributionsResponse> {
    return this.addRequest<CrowdloanContributionsResponse>(async () => {
      const rs = await this.postRequest(this.getApiUrl(relayChain, 'api/scan/account/contributions'), {
        include_total: true,
        page,
        row: QUERY_ROW,
        who: address
      });

      if (rs.status !== 200) {
        throw new SWError('SubscanService.getCrowdloanContributions', await rs.text());
      }

      const jsonData = (await rs.json()) as SubscanResponse<CrowdloanContributionsResponse>;

      return jsonData.data;
    });
  }

  public getExtrinsicsList (chain: string, address: string, page = 0): Promise<ExtrinsicsListResponse> {
    return this.addRequest<ExtrinsicsListResponse>(async () => {
      const rs = await this.postRequest(this.getApiUrl(chain, 'api/scan/extrinsics'), {
        page,
        row: QUERY_ROW,
        address
      });

      if (rs.status !== 200) {
        throw new SWError('SubscanService.getExtrinsicsList', await rs.text());
      }

      const jsonData = (await rs.json()) as SubscanResponse<ExtrinsicsListResponse>;

      return jsonData.data;
    });
  }

  public async fetchAllPossibleExtrinsicItems (
    chain: string,
    address: string,
    cbAfterEachRequest?: (items: ExtrinsicItem[]) => void
  ): Promise<ExtrinsicItem[]> {
    let count = 0;
    const resultMap: Record<string, ExtrinsicItem> = {};

    const _getExtrinsicItems = async (page: number) => {
      const res = await this.getExtrinsicsList(chain, address, page);

      if (!res || !res.count || !res.extrinsics || !res.extrinsics.length) {
        return;
      }

      if (res.count > count) {
        count = res.count;
      }

      cbAfterEachRequest?.(res.extrinsics);
      res.extrinsics.forEach((item) => {
        resultMap[item.extrinsic_hash] = item;
      });

      if (Object.values(resultMap).length < count) {
        await wait(100);

        await _getExtrinsicItems(++page);
      }
    };

    await _getExtrinsicItems(0);

    return Object.values(resultMap);
  }

  public getTransfersList (chain: string, address: string, page = 0, direction?: 'sent' | 'received'): Promise<TransfersListResponse> {
    const requestBody: {
      page: number,
      row: number,
      address: string,
      direction?: 'sent' | 'received'
    } = {
      page,
      row: QUERY_ROW,
      address
    };

    if (direction) {
      requestBody.direction = direction;
    }

    return this.addRequest<TransfersListResponse>(async () => {
      const rs = await this.postRequest(this.getApiUrl(chain, 'api/v2/scan/transfers'), requestBody);

      if (rs.status !== 200) {
        throw new SWError('SubscanService.getTransfersList', await rs.text());
      }

      const jsonData = (await rs.json()) as SubscanResponse<TransfersListResponse>;

      return jsonData.data;
    });
  }

  public async fetchAllPossibleTransferItems (
    chain: string,
    address: string,
    direction?: 'sent' | 'received',
    cbAfterEachRequest?: (items: TransferItem[]) => void
  ): Promise<TransferItem[]> {
    let count = 0;
    const resultMap: Record<string, TransferItem> = {};

    const _getTransferItems = async (page: number) => {
      const res = await this.getTransfersList(chain, address, page, direction);

      if (!res || !res.count || !res.transfers || !res.transfers.length) {
        return;
      }

      if (res.count > count) {
        count = res.count;
      }

      cbAfterEachRequest?.(res.transfers);
      res.transfers.forEach((item) => {
        resultMap[item.hash] = item;
      });

      if (Object.values(resultMap).length < count) {
        await wait(100);

        await _getTransferItems(++page);
      }
    };

    await _getTransferItems(0);

    return Object.values(resultMap);
  }
}
