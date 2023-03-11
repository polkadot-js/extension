// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';

type getFreeBalanceFunc = (chain: string, address: string, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, tokenSlug?: string) => Promise<string>;
export class BalanceService {
  public readonly getFreeBalance: getFreeBalanceFunc;

  constructor (getFreeBalance: getFreeBalanceFunc) {
    this.getFreeBalance = getFreeBalance;
  }
}
