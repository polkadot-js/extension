// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { initApi } from '@polkadot/extension-koni-base/api/dotsama';
import { MoonbeamNftApi } from '@polkadot/extension-koni-base/api/nft/moonbeam_nft/index';

function main () {
  const api = initApi('moonbeam', 'wss://wss.api.moonbeam.network');
  const nftApi = new MoonbeamNftApi(api, ['0x3d6481dfc8275026f5311bc8767e6c2e38eef4e6'], 'moonbeam');

  console.log(nftApi.getChain());
}

main();
