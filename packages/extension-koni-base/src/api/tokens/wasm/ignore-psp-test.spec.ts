// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { PSP22Contract } from '@subwallet/extension-koni-base/api/tokens/wasm/helper';
import { DOTSAMA_AUTO_CONNECT_MS } from '@subwallet/extension-koni-base/constants';
import { getCurrentProvider, isValidSubstrateAddress } from '@subwallet/extension-koni-base/utils';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { Weight } from '@polkadot/types/interfaces';
import { BN, BN_MILLION, BN_TEN, BN_THOUSAND, BN_TWO, bnMin } from '@polkadot/util';

jest.setTimeout(5000000);

// Some chains incorrectly use these, i.e. it is set to values such as 0 or even 2
// Use a low minimum validity threshold to check these against
const THRESHOLD = BN_THOUSAND.div(BN_TWO);
const DEFAULT_TIME = new BN(6_000);

function getBlockInterval (api: ApiPromise): BN {
  const aDay = new BN(24 * 60 * 60 * 1000);

  // @ts-ignore
  return bnMin(aDay, (
    // Babe, e.g. Relay chains (Substrate defaults)
    api.consts.babe?.expectedBlockTime ||
    // POW, eg. Kulupu
    api.consts.difficulty?.targetBlockTime ||
    // Subspace
    api.consts.subspace?.expectedBlockTime || (
      // Check against threshold to determine value validity
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      api.consts.timestamp?.minimumPeriod.gte(THRESHOLD)
        // Default minimum period config
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        ? api.consts.timestamp.minimumPeriod.mul(BN_TWO)
        : api.query.parachainSystem
          // default guess for a parachain
          ? DEFAULT_TIME.mul(BN_TWO)
          // default guess for others
          : DEFAULT_TIME
    )
  ));
}

function getMegaGas (api: ApiPromise): BN {
  const maxBlockWeight = api.consts.system.blockWeights
    // @ts-ignore
    ? api.consts.system.blockWeights.maxBlock as BN
    : api.consts.system.maximumBlockWeight as Weight;

  return maxBlockWeight.div(BN_MILLION).div(BN_TEN);
}

describe('test DotSama APIs', () => {
  test('test smart contract', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.alephTest), DOTSAMA_AUTO_CONNECT_MS);
    const apiPromise = new ApiPromise({ provider });
    const api = await apiPromise.isReady;

    const contract = new ContractPromise(api, PSP22Contract, '5CY8zDBjUDNwZBHdGbERtLLSZqY7dJYsm1KhY6tSorYvnSke');

    const nameResp = await contract.query['psp22Metadata::tokenName']('5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc', { gasLimit: -1 });
    const symbolResp = await contract.query['psp22Metadata::tokenSymbol']('5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc', { gasLimit: -1 });
    const decimalsResp = await contract.query['psp22Metadata::tokenDecimals']('5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc', { gasLimit: -1 });

    console.log(nameResp.output?.toHuman());
    console.log(symbolResp.output?.toHuman());
    console.log(decimalsResp.output?.toHuman());

    // const totalSupply = await contract.query['psp22::totalSupply']('5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc', { gasLimit: -1 });
    //
    // const _result = totalSupply.output.toHuman();
    //
    // console.log(_result);
    //
    // const balanceOf = await contract.query['psp22::balanceOf']('5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc', { gasLimit: -1 }, '5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc');

    // const result = balanceOf.output.toString();
    //
    // console.log(balanceOf.result.isOk);
    //
    // console.log('result', typeof result, result);
    //
    // const transfer = contract.tx['psp22::transfer']({ gasLimit: '100000' }, '5Dy4D7r9HeWvrcyjUF51zK3z3gePYrcaT9fF8Q7M6LYhgrGM', '100000', '');
    //
    // console.log((await transfer.paymentInfo('5Dy4D7r9HeWvrcyjUF51zK3z3gePYrcaT9fF8Q7M6LYhgrGM')).toHuman());
    //
    const megaGas = getMegaGas(api);

    const blockInterval = getBlockInterval(api);

    console.log(blockInterval.toString());
    //
    const weight = megaGas.mul(BN_MILLION);

    console.log(weight);
    //
    // const executionTime = weight.mul(blockInterval).div(
    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    //   api.consts.system.blockWeights
    //     // @ts-ignore
    //     ? api.consts.system.blockWeights.maxBlock
    //     : api.consts.system.maximumBlockWeight as Weight
    // ).toNumber();
    //
    // console.log('megaGas', megaGas.toNumber());
    // console.log('weight', weight.toNumber());
    // console.log(executionTime);
  });

  test('validate contract', async () => {
    const resp = isValidSubstrateAddress('5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc');
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.polkadot), DOTSAMA_AUTO_CONNECT_MS);
    const apiPromise = new ApiPromise({ provider });
    const api = await apiPromise.isReady;

    console.log(api.query.contracts);
    console.log('resp', resp);
    //
    // // const psp34Address = '5EQXQ5E1NfU6Znm3avpZM7mArxZDwQeugJG3pFNADU6Pygfw';
    // const psp22Address = '5CY8zDBjUDNwZBHdGbERtLLSZqY7dJYsm1KhY6tSorYvnSke';
    //
    // const res = await validateWasmToken(psp22Address, CustomTokenType.psp22, api, '5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc');
    //
    // console.log(res);
  });
});
