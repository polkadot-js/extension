// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainService } from '@subwallet/extension-koni-base/services/chain-service/index';

describe('test ChainService', () => {
  test('test get chains', () => {
    const chainService = new ChainService();

    console.log(chainService.getChainInfoMap());
  });
});
