// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

// Test for index.ts

import { SUBSCAN_API_CHAIN_MAP } from '@subwallet/extension-base/services/subscan-service/subscan-chain-map';

import { SubscanService } from './index';

jest.setTimeout(60000);

describe('SubscanService', () => {
  let subscanService: SubscanService;

  beforeAll(() => {
    subscanService = new SubscanService(SUBSCAN_API_CHAIN_MAP);
  });

  it('Get multi-chain balance', async () => {
    const rs = await Promise.all([
      subscanService.getMultiChainBalance('5ENp8Z2pquNyiPpRa59ihAeb5a871G3REMhn27Rzwp4P84SL'),
      subscanService.getMultiChainBalance('5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc')
    ]);

    console.log(rs);
  });
});
