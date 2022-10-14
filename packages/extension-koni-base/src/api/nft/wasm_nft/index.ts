// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, CustomToken, NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { BaseNftApi, HandleNftParams } from '@subwallet/extension-koni-base/api/nft/nft';
import { PSP34Contract } from '@subwallet/extension-koni-base/api/tokens/wasm/helper';

import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { isEthereumAddress } from '@polkadot/util-crypto';

export class WasmNftApi extends BaseNftApi {
  apiPromise: ApiPromise;
  private wasmContracts: CustomToken[] = [];

  constructor (api: ApiProps | null, addresses: string[], chain: string, apiPromise: ApiPromise) {
    super(chain, null, addresses);
    this.apiPromise = apiPromise;
  }

  setWasmContracts (wasmContracts: CustomToken[]) {
    this.wasmContracts = wasmContracts;
  }

  getWasmContracts () {
    return this.wasmContracts;
  }

  private async getItemsByCollection (smartContract: string, collectionName: string | undefined, nftParams: HandleNftParams) {
    const contractPromise = new ContractPromise(this.apiPromise, PSP34Contract, '5CY8zDBjUDNwZBHdGbERtLLSZqY7dJYsm1KhY6tSorYvnSke');
    const ownItem = false;

    let collectionImage: string | undefined;

    // TODO: try to fetch the collection metadata on-chain first
    const _onChainAttributeCount = await contractPromise.query['psp34Traits::getAttributeCount'](this.addresses[0], {gasLimit: -1});
    const onChainAttributeCount = _onChainAttributeCount.output ? _onChainAttributeCount.output.toString() : '0';

    console.log('Fetch metadata on-chain: ', onChainAttributeCount);

    await Promise.all(this.addresses.map(async (address) => {
      if (isEthereumAddress(address)) {
        return;
      }

      const nftIds: string[] = [];

      const _balance = await contractPromise.query['psp34::balanceOf'](address, { gasLimit: -1 }, address);

      const balance = _balance.output ? _balance.output.toString() : '0';

      if (parseInt(balance) === 0) {
        nftParams.updateNftIds(this.chain, address, smartContract, nftIds);

        return;
      }

      const itemIndexes: number[] = [];

      for (let i = 0; i < parseInt(balance); i++) {
        itemIndexes.push(i);
      }

      try {
        await Promise.all(itemIndexes.map(async (i) => {
          const tokenId = await contractPromise.query['psp34Enumerable::ownersTokenByIndex'](address, {gasLimit: -1}, address, i);

        }));
      } catch (e) {
        console.error(`error parsing item for ${this.chain} nft`, e);
      }
    }));
  }

  public async fetchNfts (params: HandleNftParams): Promise<number> {
    try {
      await this.handleNfts(params);
    } catch (e) {
      return 0;
    }

    return 1;
  }

  async handleNfts (params: HandleNftParams): Promise<void> {
    if (!this.wasmContracts || this.wasmContracts.length === 0) {
      return;
    }

    await this.connect(); // might not be necessary
    await Promise.all(this.wasmContracts.map(async ({ isCustom, name, smartContract }) => {
      return await this.getItemsByCollection(smartContract, name, params);
    }));
  }
}
