// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { AssetRefMap, ChainAssetMap, ChainInfoMap } from '@subwallet/chain-list';
import { createXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm';
import { SubstrateChainHandler } from '@subwallet/extension-base/services/chain-service/handler/SubstrateChainHandler';

import { cryptoWaitReady } from '@polkadot/util-crypto';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';

jest.setTimeout(1000 * 60 * 10);

const destAddress_1 = '5DnokDpMdNEH8cApsZoWQnjsggADXQmGWUb6q8ZhHeEwvncL';
const destAddress_2 = '0x49E46fc304a448A2132d2DBEd6df47D0084cE92f';

const uniqueArray = (array: string[]): string[] => {
  const map: Record<string, string> = {};

  array.forEach((v) => {
    map[v] = v;
  });

  return Object.keys(map);
};

describe('test token transfer', () => {
  let substrateChainHandler: SubstrateChainHandler;

  beforeAll(async () => {
    await cryptoWaitReady();

    substrateChainHandler = new SubstrateChainHandler();
  });

  it('substrate transfer', async () => {
    const rawSrcChains = Object.values(AssetRefMap).map((value) => value.srcChain);
    const srcChains = uniqueArray(rawSrcChains);
    const errorList: string[] = [];

    for (const srcChain of srcChains) {
      const assetRef = Object.values(AssetRefMap).find((ref) => ref.srcChain === srcChain);

      if (!assetRef) {
        continue;
      }

      const chain = ChainInfoMap[srcChain];

      const substrateApi = await substrateChainHandler.initApi(srcChain, chain.providers[Object.keys(chain.providers)[0]]);

      const originTokenInfo = ChainAssetMap[assetRef.srcAsset];
      const destinationTokenInfo = ChainAssetMap[assetRef.destAsset];
      const destChain = ChainInfoMap[assetRef.destChain];
      const isDestChainEvm = _isChainEvmCompatible(destChain);
      const destAddress = isDestChainEvm ? destAddress_2 : destAddress_1;

      try {
        await createXcmExtrinsic({
          destinationTokenInfo,
          originTokenInfo,
          sendingValue: '0',
          recipient: destAddress,
          chainInfoMap: ChainInfoMap,
          substrateApi
        });
      } catch (e) {
        console.log(e);
        errorList.push(srcChain);
      }
    }

    console.log(errorList);
  });
});
