// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ChainAssetMap, ChainInfoMap } from '@subwallet/chain-list';
import { _AssetType, _ChainAsset } from '@subwallet/chain-list/types';
import { createTransferExtrinsic } from '@subwallet/extension-base/services/balance-service/transfer/token';
import { getERC20TransactionObject, getEVMTransactionObject } from '@subwallet/extension-base/services/balance-service/transfer/smart-contract';
import { EvmChainHandler } from '@subwallet/extension-base/services/chain-service/handler/EvmChainHandler';
import { SubstrateChainHandler } from '@subwallet/extension-base/services/chain-service/handler/SubstrateChainHandler';
import { _getContractAddressOfToken, _isLocalToken, _isTokenEvmSmartContract } from '@subwallet/extension-base/services/chain-service/utils';
import BigN from 'bignumber.js';
import fs from 'fs';
import { TransactionConfig } from 'web3-core';

import { cryptoWaitReady } from '@polkadot/util-crypto';

jest.setTimeout(1000 * 60 * 10);

describe('test token transfer', () => {
  let substrateChainHandler: SubstrateChainHandler;
  let evmChainHandler: EvmChainHandler;

  beforeAll(async () => {
    await cryptoWaitReady();

    substrateChainHandler = new SubstrateChainHandler();
    evmChainHandler = new EvmChainHandler();
  });

  it('substrate transfer', async () => {
    const chainList = Object.values(ChainInfoMap).filter((chain) => !chain.evmInfo);
    const start = 0;
    const count = 1;
    const errors: Array<[string, string]> = [];
    const unSupports: Array<[string, string]> = [];

    for (let i = start; i < start + count && i < chainList.length; i++) {
      const chain = chainList[i];
      const networkKey = chain.slug;

      console.log('current', i);
      console.log(networkKey, 'start');

      const _api = await substrateChainHandler.initApi(networkKey, chain.providers[Object.keys(chain.providers)[0]]);

      const api = await _api.isReady;

      const assets = Object.values(ChainAssetMap).filter((asset) => asset.originChain === networkKey && ![_AssetType.ERC721, _AssetType.PSP34].includes(asset.assetType));

      for (const asset of assets) {
        try {
          const [extrinsic] = await createTransferExtrinsic({
            from: '5DnokDpMdNEH8cApsZoWQnjsggADXQmGWUb6q8ZhHeEwvncL',
            networkKey: networkKey,
            to: '5EhSb8uHkbPRF869wynQ4gh5V7B62YgkEQvMdk6tzHD9bK7b',
            substrateApi: api,
            value: '0',
            transferAll: false,
            tokenInfo: asset
          });

          if (extrinsic) {
            console.log(networkKey, asset.slug, 'success');
          } else {
            unSupports.push([networkKey, asset.slug]);
            console.log(networkKey, asset.slug, 'fail', 'unsupport');
          }
        } catch (e) {
          console.log(networkKey, asset.slug, 'fail', e);
          errors.push([networkKey, asset.slug]);
        }
      }

      console.log(networkKey, 'end');
      console.log('errors', errors);
      console.log('unSupports', unSupports);
    }
  });

  it('evm transfer', async () => {
    const chainList = Object.values(ChainInfoMap).filter((chain) => chain.evmInfo);
    const start = 20;
    const count = 10;
    const errors: Array<[string, string]> = [];
    const unSupports: Array<[string, string]> = [];

    for (let i = start; i < start + count && i < chainList.length; i++) {
      const chain = chainList[i];
      const networkKey = chain.slug;

      console.log('current', i);
      console.log(networkKey, 'start');

      const _api = await evmChainHandler.initApi(networkKey, chain.providers[Object.keys(chain.providers)[0]]);

      evmChainHandler.setEvmApi(networkKey, _api);

      await _api.isReady;

      const assets = Object.values(ChainAssetMap).filter((asset) => asset.originChain === networkKey && ![_AssetType.ERC721, _AssetType.PSP34].includes(asset.assetType));

      for (const asset of assets) {
        try {
          let transaction: TransactionConfig;

          if (_isTokenEvmSmartContract(asset) || _isLocalToken(asset)) {
            [transaction] = await getERC20TransactionObject(_getContractAddressOfToken(asset), chain, '0x29d6d6d84c9662486198667b5a9fbda3e698b23f', '0x5e10e440FEce4dB0b16a6159A4536efb74d32E9b', '0', false, _api);
          } else {
            [transaction] = await getEVMTransactionObject(chain, '0x29d6d6d84c9662486198667b5a9fbda3e698b23f', '0x5e10e440FEce4dB0b16a6159A4536efb74d32E9b', '0', false, _api);
          }

          if (transaction) {
            console.log(networkKey, asset.slug, 'success');
          } else {
            unSupports.push([networkKey, asset.slug]);
            console.log(networkKey, asset.slug, 'fail', 'unsupport');
          }
        } catch (e) {
          console.log(networkKey, asset.slug, 'fail', e);
          errors.push([networkKey, asset.slug]);
        }
      }

      console.log(networkKey, 'end');
    }

    console.log('errors', errors);
    console.log('unSupports', unSupports);
  });

  it('get asset ed', async () => {
    return new Promise<void>((resolve) => {
      const result: _ChainAsset[] = [];

      for (const asset of Object.values(ChainAssetMap)) {
        const minAmount = asset.minAmount;

        if (!!minAmount && !['', '0'].includes(minAmount)) {
          result.push(asset);
        }
      }

      const rows: string[] = [];
      const headers = ['Slug', 'Network', 'Token', 'Symbol', 'Type', 'Decimals', 'Min amount', 'Min amount converted'];

      rows.push(headers.join(','));

      result.forEach((asset) => {
        if (ChainInfoMap[asset.originChain]) {
          const network = ChainInfoMap[asset.originChain].name;
          const slug = asset.slug;
          const token = asset.name;
          const symbol = asset.symbol;
          const type = asset.assetType;
          const decimals = (asset.decimals || 0).toString();
          const minAmount = asset.minAmount as string;
          const minAmountConverted = new BigN(minAmount).div(new BigN(10).pow(decimals)).toFixed();
          const data: string[] = [slug, network, token, symbol, type, decimals, minAmount, minAmountConverted];

          rows.push(data.join(','));
        } else {
          console.log(asset);
        }
      });

      fs.writeFile('./ed_result.csv', rows.join('\n'), () => {
        console.log('success');
        resolve();
      });
    });
  });

  it('check token price', async () => {
    return new Promise<void>((resolve) => {
      const havePriceRows: string[] = [];
      const noPriceRows: string[] = [];
      const headers = ['Slug', 'Network', 'Token', 'Symbol', 'Type', 'Is Test Network', 'Is Test Token', 'Price Id'];

      havePriceRows.push(headers.join(','));
      noPriceRows.push(headers.join(','));

      Object.values(ChainAssetMap).forEach((asset) => {
        if (ChainInfoMap[asset.originChain] && ![_AssetType.ERC721, _AssetType.PSP34].includes(asset.assetType)) {
          const network = ChainInfoMap[asset.originChain].name;
          const slug = asset.slug;
          const token = asset.name;
          const symbol = asset.symbol;
          const type = asset.assetType;
          const isTestNetwork = ChainInfoMap[asset.originChain].isTestnet ? 'true' : 'false';
          const isTestToken = !asset.hasValue ? 'true' : 'false';
          const priceId = asset.priceId || '';
          const data: string[] = [slug, network, token, symbol, type, isTestNetwork, isTestToken, priceId];

          if (priceId) {
            havePriceRows.push(data.join(','));
          } else {
            noPriceRows.push(data.join(','));
          }
        } else {
          console.log(asset);
        }
      });

      const isDone = {
        havePrice: false,
        noPrice: false
      };

      const checkDone = () => {
        if (isDone.havePrice && isDone.noPrice) {
          resolve();
        }
      };

      fs.writeFile('./have_price_id_result.csv', havePriceRows.join('\n'), () => {
        console.log('success');
        isDone.havePrice = true;
        checkDone();
      });

      fs.writeFile('./no_price_id_result.csv', noPriceRows.join('\n'), () => {
        console.log('success');
        isDone.noPrice = true;
        checkDone();
      });
    });
  });
});
