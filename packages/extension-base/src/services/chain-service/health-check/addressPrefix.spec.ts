// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainInfoMap } from '@subwallet/chain-list';
import { SubstrateChainHandler } from '@subwallet/extension-base/services/chain-service/handler/SubstrateChainHandler';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';

import { cryptoWaitReady } from '@polkadot/util-crypto';

jest.setTimeout(60 * 60 * 1000);

interface Result {
  slug: string;
  oldPrefix: number;
  newPrefix: number;
}

const failedMessage = 'Connect failed';
const timeoutMessage = 'Connect timeout';

const handleConnectChain = async (handler: SubstrateChainHandler, key: string, provider: string): Promise<_SubstrateApi> => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-async-promise-executor
  return new Promise<_SubstrateApi>(async (resolve, reject) => {
    const _api = await handler.initApi(key, provider);

    const handlerOnFail = () => {
      console.log('error', key);
      reject(new Error(failedMessage));
    };

    const timeout = setTimeout(() => {
      console.log('timeout', key);
      reject(new Error(timeoutMessage));
      _api.api.off('disconnected', handlerOnFail);
      _api.api.off('error', handlerOnFail);
    }, 30 * 1000);

    _api.api.on('disconnected', handlerOnFail);
    _api.api.on('error', handlerOnFail);

    const api = await _api.isReady;

    clearTimeout(timeout);
    _api.api.off('disconnected', handlerOnFail);
    _api.api.off('error', handlerOnFail);

    resolve(api);
  });
};

const timeoutlist = [
  'nodle',
  'polkadexTest',
  'rmrk',
  'efinity',
  'crust',
  'statemine',
  'khala',
  'kilt',
  'altair',
  'heiko',
  'picasso',
  'unique_network',
  'zeitgeist',
  'sakura',
  'uniqueNft',
  'robonomics',
  'integriteePolkadot',
  'crabParachain',
  'tinkernet',
  'subspace_test',
  'subspace_gemini_3c',
  'origintrail',
  'listen',
  'gmdie',
  'ternoa',
  'tanganika',
  'pendulum',
  'gear_testnet',
  'ternoa_alphanet',
  'calamari_test',
  'kilt_peregrine',
  'xx_network',
  'watr_network',
  'fusotao',
  'discovol',
  'discovol_testnet',
  'atocha',
  'myriad',
  'deBio',
  'barnacle',
  'collectives',
  'bitgreen',
  'frequency',
  'kapex',
  'kylinNetwork',
  'kico',
  'luhnNetwork',
  'riodefi',
  'automata',
  'crownSterling',
  'dockPosMainnet'
];

const errorList = [
  'bitcountry',
  'dolphin',
  'genshiro_testnet',
  'acala_testnet',
  'mangatax',
  'subspace_gemini_3d',
  'subspace_gemini_3e',
  'dorafactory',
  'hashedNetwork',
  'ipci',
  'pichiu',
  'kusari',
  'riochain',
  'sherpax',
  'swapdex',
  'alephSmartNet'
];

const errorOnProviderIndex: Array<Array<string>> = [[], ['efinity', 'tinkernet']];
// const recheckTimeout: Array<string> = ['acala_testnet', 'subspace_gemini_3d', 'pichiu'];

describe('test chain prefix', () => {
  let substrateChainHandler: SubstrateChainHandler;

  beforeAll(async () => {
    await cryptoWaitReady();

    substrateChainHandler = new SubstrateChainHandler();
  });

  it('substrate prefix', async () => {
    const chainList = Object.values(ChainInfoMap).filter((chain) =>
      !!chain.substrateInfo &&
      !timeoutlist.includes(chain.slug) &&
      !errorList.includes(chain.slug) &&
      // recheckTimeout.includes(chain.slug)
      true
    );

    const results: Array<Result> = [];
    const errorChain: string[] = [];
    const timeoutChain: string[] = [];
    const notFoundProvider: string[] = [];
    const successList: string[] = [];
    const doneMap: Record<string, boolean> = {};

    const providerIndex = 0;

    for (let i = 0; i < chainList.length; i++) {
      const info = chainList[i];
      const slug = info.slug;
      const provider = info.providers[Object.keys(info.providers)[providerIndex]];
      const providerError = errorOnProviderIndex[providerIndex]?.includes(slug);

      console.log('current', i);
      console.log(slug, 'start');
      doneMap[slug] = false;

      if (provider && !providerError) {
        try {
          const api = await handleConnectChain(substrateChainHandler, slug, provider);
          const prefix = api.api.consts.system.ss58Prefix.toPrimitive() as number;
          const oldPrefix = info.substrateInfo?.addressPrefix ?? 42;

          if (oldPrefix !== prefix) {
            results.push({
              slug: slug,
              newPrefix: prefix,
              oldPrefix: oldPrefix
            });
          }

          successList.push(slug);
        } catch (e) {
          const error = e as Error;

          if (error.message === failedMessage) {
            errorChain.push(slug);
          } else if (error.message === timeoutMessage) {
            timeoutChain.push(slug);
            substrateChainHandler.destroySubstrateApi(slug);
          }
        }
      } else {
        notFoundProvider.push(slug);
      }

      doneMap[slug] = true;
      const previous = i - 5;

      if (previous >= 0) {
        const chain = chainList[i].slug;

        if (doneMap[chain]) {
          substrateChainHandler.destroySubstrateApi(chain);
        }
      }
    }

    console.log('results', results);
    console.log('successList', successList);
    console.log('errorChain', errorChain);
    console.log('timeoutChain', timeoutChain);
    console.log('notFoundProvider', notFoundProvider);
  });
});
