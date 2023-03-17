// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { fetchMultiChainHistories } from '@subwallet/extension-base/services/history-service/subsquid-multi-chain-history';
import { TEST_CHAIN_MAP } from '@subwallet/extension-base/test/chainMap';

jest.setTimeout(50000);
describe('TestFetchMultiChainHistories', () => {
  let fetchingRs: TransactionHistoryItem[];

  beforeAll(async () => {
    fetchingRs = await fetchMultiChainHistories(['5CXCbp6HeFDGeNZpgP6LmQdxxGaM7DosN9bNmVj72nQ3hU3G', '0x2D3051BC4Ed05aE74AcB53Bff8034252C3F43755', '5DMJvWRCVCJhkozcJFCVpbpsjB7sTqjYKCh2r7aX6nBi6Lhb', '0x3e5f6488b2532fF833fad632d520dD55747dA806', '0x3f3511480af05B032Ea9f4CDDB741a90D9726BFD', '0x461aFA5E86f18DD101Fda0656F77a849eE6EAc69', '5Dyj33f2mpWc1je9X2QGQydyrDGgv4RFPrfyP3bSEdVn3cKc', '5Dz513kvDZcdmgNyRXeLRP6aHAYwZkkBpYjEukj6pkMNGYzW', '0xA1b5c22EE7bf2F3CBCD97f3EE17bF7cea456A28A', '5FnXWsiDmoPw8otKCti46ayDqDNBqgpysKVXzfWGAWd6iRyT', '0xA7F4F315Cc2B91ab6f0707f2C7a4Fe557Cb1C701', '5FsqykVr2rLCeWQqk8q75qVtNzmgQFNENtBoBzPSzUdvzKb5', '5GBw5o91TwwLwpj24ucJimWZhpg9bc5W9mBTMERjiaYYsENd', '5GgQC5CfA8EKb2BCrr1VKYyj8536pugDTFAWh3WN4xu8P8JR', '5GpqtnoVC2VPotzrM9WgLtr1QQd1Gh3XxyJGs7xQEq1VZmrN', '0xe7a9a370747aab5e7ff1C621a9C337Ca5b8dEbAd', '5HbcGs2QXVAc6Q6eoTzLYNAJWpN17AkCFRLnWDaHCiGYXvNc'], TEST_CHAIN_MAP);
  });

  // Create Unit Test for QueryInput
  it('Fetching data', () => {
    expect(fetchingRs.length).toBeGreaterThan(-1);
    console.log(fetchingRs.length);
  });
});
