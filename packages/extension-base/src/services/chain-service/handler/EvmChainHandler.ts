// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType } from '@subwallet/chain-list/types';
import { EvmApi } from '@subwallet/extension-base/services/chain-service/handler/EvmApi';
import { _EvmChainSpec } from '@subwallet/extension-base/services/chain-service/handler/types';
import { _ERC20_ABI, _ERC721_ABI } from '@subwallet/extension-base/services/chain-service/helper';
import { _EvmApi, _SmartContractTokenInfo } from '@subwallet/extension-base/services/chain-service/types';
import { BehaviorSubject } from 'rxjs';
import { Contract } from 'web3-eth-contract';

import { logger as createLogger } from '@polkadot/util/logger';
import { Logger } from '@polkadot/util/types';

export class EvmChainHandler {
  private evmApiMap: Record<string, _EvmApi> = {};
  readonly apiStateMapSubject = new BehaviorSubject<Record<string, boolean>>({});
  private logger: Logger;

  constructor () {
    this.logger = createLogger('evm-chain-handler');
  }

  public getEvmApiMap () {
    return this.evmApiMap;
  }

  public getEvmApiByChain (chainSlug: string) {
    return this.evmApiMap[chainSlug];
  }

  public setEvmApi (chainSlug: string, evmApi: _EvmApi) {
    this.evmApiMap[chainSlug] = evmApi;
  }

  public destroyEvmApi (chainSlug: string) {
    const evmApi = this.getEvmApiByChain(chainSlug);

    if (!evmApi) {
      return;
    }

    this.evmApiMap[chainSlug].destroy();
  }

  public refreshApi (slug: string, endpoint: string, providerName?: string) {
    this.evmApiMap[slug] = this.initApi(slug, endpoint, providerName);
  }

  public initApi (chainSlug: string, apiUrl: string, providerName?: string): _EvmApi {
    const existed = this.getEvmApiByChain(chainSlug);

    if (existed) {
      existed.connect();

      return existed;
    }

    const apiObject = new EvmApi(chainSlug, apiUrl, providerName);

    apiObject.isApiConnectedSubject.subscribe((isConnected) => {
      const currentMap = this.apiStateMapSubject.getValue();

      this.apiStateMapSubject.next({
        ...currentMap,
        [chainSlug]: isConnected
      });
    });

    return apiObject;
  }

  public async getChainSpec (evmApi: _EvmApi) {
    const chainId = await evmApi.api.eth.getChainId();
    let chainInfoList: Record<string, any>[] | undefined;
    const result: _EvmChainSpec = {
      evmChainId: chainId,
      name: '',
      symbol: '',
      decimals: 18, // by default, might change
      existentialDeposit: '0'
    };

    await fetch('https://chainid.network/chains.json')
      .then((resp) => resp.json())
      .then((data: Record<string, any>[]) => {
        chainInfoList = data;
      });

    if (chainInfoList) {
      chainInfoList.forEach((_chainInfo) => {
        const _chainId = _chainInfo.chainId as number;

        if (chainId === _chainId) {
          result.name = _chainInfo.name as string;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          result.symbol = _chainInfo.nativeCurrency.symbol as string;
        }
      });
    }

    return result;
  }

  public async getSmartContractTokenInfo (contractAddress: string, tokenType: _AssetType, originChain: string): Promise<_SmartContractTokenInfo> {
    let tokenContract: Contract;
    let name = '';
    let decimals: number | undefined = -1;
    let symbol = '';
    let contractError = false;

    const evmApi = this.getEvmApiByChain(originChain);

    try {
      if (tokenType === _AssetType.ERC721) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
        tokenContract = new evmApi.api.eth.Contract(_ERC721_ABI, contractAddress);

        const [_name, _symbol] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          tokenContract.methods.name().call() as string,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          tokenContract.methods.symbol().call() as string
        ]);

        name = _name;
        symbol = _symbol;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
        tokenContract = new evmApi.api.eth.Contract(_ERC20_ABI, contractAddress);

        const [_decimals, _symbol] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          tokenContract.methods.decimals().call() as number,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          tokenContract.methods.symbol().call() as string
        ]);

        name = _symbol;
        decimals = _decimals;
        symbol = _symbol;
      }

      if (name === '' || symbol === '') {
        contractError = true;
      }

      return {
        name,
        decimals,
        symbol,
        contractError
      };
    } catch (e) {
      this.logger.error(e);

      return {
        name,
        decimals,
        symbol,
        contractError: true
      };
    }
  }
}
