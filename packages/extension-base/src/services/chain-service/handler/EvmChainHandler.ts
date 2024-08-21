// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType } from '@subwallet/chain-list/types';
import { _ERC20_ABI, _ERC721_ABI } from '@subwallet/extension-base/koni/api/contract-handler/utils';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { AbstractChainHandler } from '@subwallet/extension-base/services/chain-service/handler/AbstractChainHandler';
import { EvmApi } from '@subwallet/extension-base/services/chain-service/handler/EvmApi';
import { _ApiOptions, _EvmChainSpec } from '@subwallet/extension-base/services/chain-service/handler/types';
import { _EvmApi, _SmartContractTokenInfo } from '@subwallet/extension-base/services/chain-service/types';
import BigN from 'bignumber.js';
import { Contract } from 'web3-eth-contract';

import { logger as createLogger } from '@polkadot/util/logger';
import { Logger } from '@polkadot/util/types';

export class EvmChainHandler extends AbstractChainHandler {
  private evmApiMap: Record<string, EvmApi> = {};
  private logger: Logger;

  constructor (parent?: ChainService) {
    super(parent);
    this.logger = createLogger('evm-chain-handler');
  }

  public getEvmApiMap () {
    return this.evmApiMap;
  }

  public getEvmApiByChain (chainSlug: string) {
    return this.evmApiMap[chainSlug];
  }

  public getApiByChain (chain: string) {
    return this.getEvmApiByChain(chain);
  }

  public setEvmApi (chainSlug: string, evmApi: EvmApi) {
    this.evmApiMap[chainSlug] = evmApi;
  }

  public async initApi (chainSlug: string, apiUrl: string, { onUpdateStatus, providerName }: Omit<_ApiOptions, 'metadata'> = {}) {
    const existed = this.getEvmApiByChain(chainSlug);

    if (existed) {
      existed.connect();

      if (apiUrl !== existed.apiUrl) {
        existed.updateApiUrl(apiUrl).catch(console.error);
      }

      return existed;
    }

    const apiObject = new EvmApi(chainSlug, apiUrl, { providerName });

    apiObject.connectionStatusSubject.subscribe(this.handleConnection.bind(this, chainSlug));
    apiObject.connectionStatusSubject.subscribe(onUpdateStatus);

    return Promise.resolve(apiObject);
  }

  public async recoverApi (chainSlug: string): Promise<void> {
    const existed = this.getEvmApiByChain(chainSlug);

    if (existed && !existed.isApiReadyOnce) {
      console.log(`Reconnect ${existed.providerName || existed.chainSlug} at ${existed.apiUrl}`);

      return existed.recoverConnect();
    }
  }

  destroyEvmApi (chain: string) {
    const evmApi = this.getEvmApiByChain(chain);

    evmApi?.destroy().catch(console.error);
  }

  async sleep () {
    this.isSleeping = true;
    this.cancelAllRecover();

    await Promise.all(Object.values(this.getEvmApiMap()).map((evmApi) => {
      return evmApi.disconnect().catch(console.error);
    }));

    return Promise.resolve();
  }

  wakeUp () {
    this.isSleeping = false;
    const activeChains = this.parent?.getActiveChains() || [];

    for (const chain of activeChains) {
      const evmApi = this.getEvmApiByChain(chain);

      // Not found evmApi mean it active with substrate interface
      evmApi?.connect();
    }

    return Promise.resolve();
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

  public async getEvmContractTokenInfo (contractAddress: string, tokenType: _AssetType, originChain: string): Promise<_SmartContractTokenInfo> {
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

        const [_decimals, _symbol, _name] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          tokenContract.methods.decimals().call() as number,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          tokenContract.methods.symbol().call() as string,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          tokenContract.methods.name().call() as string
        ]);

        name = _name;
        decimals = new BigN(_decimals).toNumber();
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
