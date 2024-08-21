// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { SWError } from '@subwallet/extension-base/background/errors/SWError';
import { BASE_FETCH_ORDINAL_EVENT_DATA } from '@subwallet/extension-base/koni/api/nft/ordinal_nft/constants';
import { SUBSCAN_API_CHAIN_MAP } from '@subwallet/extension-base/services/subscan-service/subscan-chain-map';
import { CrowdloanContributionsResponse, ExtrinsicItem, ExtrinsicsListResponse, IMultiChainBalance, RequestBlockRange, RewardHistoryListResponse, SubscanRequest, SubscanResponse, TransferItem, TransfersListResponse } from '@subwallet/extension-base/services/subscan-service/types';
import { SubscanEventBaseItemData, SubscanEventListResponse, SubscanExtrinsicParam, SubscanExtrinsicParamResponse } from '@subwallet/extension-base/types';
import { wait } from '@subwallet/extension-base/utils';

const QUERY_ROW = 100;

interface SubscanError {
  code: number;
  message: string;
}

export class SubscanService {
  private callRate = 2; // limit per interval check
  private limitRate = 2; // max rate per interval check
  private intervalCheck = 1000; // interval check in ms
  private maxRetry = 9; // interval check in ms
  private rollbackRateTime = 30 * 1000; // rollback rate time in ms
  private timeoutRollbackRate: NodeJS.Timeout | undefined = undefined;
  private requestMap: Record<number, SubscanRequest<any>> = {};
  private nextId = 0;
  private isRunning = false;
  private getId () {
    return this.nextId++;
  }

  constructor (private subscanChainMap: Record<string, string>, options?: {limitRate?: number, intervalCheck?: number, maxRetry?: number}) {
    this.callRate = options?.limitRate || this.callRate;
    this.limitRate = options?.limitRate || this.limitRate;
    this.intervalCheck = options?.intervalCheck || this.intervalCheck;
    this.maxRetry = options?.maxRetry || this.maxRetry;
  }

  private reduceLimitRate () {
    clearTimeout(this.timeoutRollbackRate);

    this.callRate = Math.ceil(this.limitRate / 2);

    this.timeoutRollbackRate = setTimeout(() => {
      this.callRate = this.limitRate;
    }, this.rollbackRateTime);
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

  public addRequest<T> (run: SubscanRequest<T>['run'], ordinal: number) {
    const newId = this.getId();

    return new Promise<T>((resolve, reject) => {
      this.requestMap[newId] = {
        id: newId,
        status: 'pending',
        retry: -1,
        ordinal,
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
        .sort((a, b) => a.ordinal - b.ordinal)
        .slice(0, this.callRate);

      // Start requests
      requests.forEach((request) => {
        request.status = 'running';
        request.run().then((rs) => {
          request.resolve(rs);
        }).catch((e: Error) => {
          const error = JSON.parse(e.message) as SubscanError;

          // Limit rate
          if (error.code === 20008) {
            if (request.retry < maxRetry) {
              request.status = 'pending';
              request.retry++;
              this.reduceLimitRate();
            } else {
              // Reject request
              request.reject(new SWError('MAX_RETRY', String(e)));
            }
          } else {
            request.reject(new SWError('UNKNOWN', String(e)));
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
    }, 1);
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
    }, 2);
  }

  public getExtrinsicsList (chain: string, address: string, page = 0, blockRange?: RequestBlockRange): Promise<ExtrinsicsListResponse> {
    const _blockRange = (() => {
      if (!blockRange || !blockRange.to) {
        return null;
      }

      return `${blockRange.from || 0}-${blockRange.to}`;
    })();

    return this.addRequest<ExtrinsicsListResponse>(async () => {
      const rs = await this.postRequest(this.getApiUrl(chain, 'api/v2/scan/extrinsics'), {
        page,
        row: QUERY_ROW,
        address,
        block_range: _blockRange
      });

      if (rs.status !== 200) {
        throw new SWError('SubscanService.getExtrinsicsList', await rs.text());
      }

      const jsonData = (await rs.json()) as SubscanResponse<ExtrinsicsListResponse>;

      return jsonData.data;
    }, 0);
  }

  public async fetchAllPossibleExtrinsicItems (
    chain: string,
    address: string,
    cbAfterEachRequest?: (items: ExtrinsicItem[]) => void,
    limit = {
      page: 10,
      record: 1000
    }
  ): Promise<ExtrinsicItem[]> {
    let maxCount = 0;
    let currentCount = 0;
    const blockRange: RequestBlockRange = {
      from: null,
      to: null
    };
    const resultMap: Record<string, ExtrinsicItem> = {};

    const _getExtrinsicItems = async (page: number) => {
      const res = await this.getExtrinsicsList(chain, address, page, blockRange);

      if (!res || !res.count || !res.extrinsics || !res.extrinsics.length) {
        return;
      }

      if (res.count > maxCount) {
        maxCount = res.count;
      }

      const extrinsics = res.extrinsics;
      const extrinsicIndexes = extrinsics.map((item) => item.extrinsic_index);
      const extrinsicParams = await this.getExtrinsicParams(chain, extrinsicIndexes, 0);

      for (const data of extrinsicParams) {
        const { extrinsic_index: extrinsicIndex, params } = data;

        const extrinsic = extrinsics.find((item) => item.extrinsic_index === extrinsicIndex);

        if (extrinsic) {
          extrinsic.params = JSON.stringify(params);
        }
      }

      // Call callback after each request, for parse data
      cbAfterEachRequest?.(extrinsics);

      for (const item of extrinsics) {
        resultMap[item.extrinsic_hash] = item;
      }

      currentCount += extrinsics.length;

      if (page > limit.page || currentCount > limit.record) {
        return;
      }

      if (currentCount < maxCount) {
        await wait(100);

        if (page === 0) {
          blockRange.to = res.extrinsics[0].block_num;
        }

        await _getExtrinsicItems(++page);
      }
    };

    await _getExtrinsicItems(0);

    return Object.values(resultMap);
  }

  public getTransfersList (chain: string, address: string, page = 0, direction?: 'sent' | 'received', blockRange?: RequestBlockRange): Promise<TransfersListResponse> {
    return this.addRequest<TransfersListResponse>(async () => {
      const rs = await this.postRequest(this.getApiUrl(chain, 'api/v2/scan/transfers'), {
        page,
        row: QUERY_ROW,
        address,
        direction: direction || null,
        from_block: blockRange?.from || null,
        to_block: blockRange?.to || null
      });

      if (rs.status !== 200) {
        throw new SWError('SubscanService.getTransfersList', await rs.text());
      }

      const jsonData = (await rs.json()) as SubscanResponse<TransfersListResponse>;

      return jsonData.data;
    }, 0);
  }

  public async fetchAllPossibleTransferItems (
    chain: string,
    address: string,
    direction?: 'sent' | 'received',
    cbAfterEachRequest?: (items: TransferItem[]) => void,
    limit = {
      page: 10,
      record: 1000
    }
  ): Promise<Record<string, TransferItem[]>> {
    let maxCount = 0;
    let currentCount = 0;
    const blockRange: RequestBlockRange = {
      from: null,
      to: null
    };
    const resultMap: Record<string, TransferItem[]> = {};

    const _getTransferItems = async (page: number) => {
      const res = await this.getTransfersList(chain, address, page, direction, blockRange);

      if (!res || !res.count || !res.transfers || !res.transfers.length) {
        return;
      }

      if (res.count > maxCount) {
        maxCount = res.count;
      }

      cbAfterEachRequest?.(res.transfers);
      res.transfers.forEach((item) => {
        if (!resultMap[item.hash]) {
          resultMap[item.hash] = [item];
        } else {
          resultMap[item.hash].push(item);
        }
      });

      currentCount += res.transfers.length;

      if (page > limit.page || currentCount > limit.record) {
        return;
      }

      if (currentCount < maxCount) {
        await wait(100);

        if (page === 0) {
          blockRange.to = res.transfers[0].block_num;
        }

        await _getTransferItems(++page);
      }
    };

    await _getTransferItems(0);

    return resultMap;
  }

  public getRewardHistoryList (chain: string, address: string, page = 0): Promise<RewardHistoryListResponse> {
    return this.addRequest<RewardHistoryListResponse>(async () => {
      const rs = await this.postRequest(this.getApiUrl(chain, 'api/scan/account/reward_slash'), {
        page,
        category: 'Reward',
        row: 10,
        address
      });

      if (rs.status !== 200) {
        throw new SWError('SubscanService.getRewardHistoryList', await rs.text());
      }

      const jsonData = (await rs.json()) as SubscanResponse<RewardHistoryListResponse>;
      const returnData = jsonData.data;

      if (!returnData) {
        return { count: 0, list: null } as RewardHistoryListResponse;
      }

      return jsonData.data;
    }, 2);
  }

  public getAccountRemarkEvents (chain: string, address: string): Promise<SubscanEventBaseItemData[]> {
    return this.addRequest<SubscanEventBaseItemData[]>(async () => {
      const rs = await this.postRequest(this.getApiUrl(chain, 'api/v2/scan/events'), {
        ...BASE_FETCH_ORDINAL_EVENT_DATA,
        address
      });

      if (rs.status !== 200) {
        throw new SWError('SubscanService.getAccountRemarkEvents', await rs.text());
      }

      const jsonData = (await rs.json()) as SubscanEventListResponse;

      return jsonData.data.events;
    }, 3);
  }

  public getExtrinsicParams (chain: string, extrinsicIndexes: string[], ordinal = 3): Promise<SubscanExtrinsicParam[]> {
    return this.addRequest<SubscanExtrinsicParam[]>(async () => {
      const rs = await this.postRequest(this.getApiUrl(chain, 'api/scan/extrinsic/params'), {
        extrinsic_index: extrinsicIndexes
      });

      if (rs.status !== 200) {
        throw new SWError('SubscanService.getExtrinsicParams', await rs.text());
      }

      const jsonData = (await rs.json()) as SubscanExtrinsicParamResponse;

      return jsonData.data;
    }, ordinal);
  }

  // Singleton
  private static _instance: SubscanService;

  public static getInstance () {
    if (!SubscanService._instance) {
      SubscanService._instance = new SubscanService(SUBSCAN_API_CHAIN_MAP);
    }

    return SubscanService._instance;
  }
}
