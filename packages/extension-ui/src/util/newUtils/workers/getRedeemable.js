// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { ApiPromise, WsProvider } from '@polkadot/api';
import { formatBalance } from '@polkadot/util';

import getNetworkInfo from '../getNetwork.ts';

async function getRedeemable (_chain, _stashAccountId) {
  console.log(`getRedeemable is called for ${_stashAccountId}`);

  const {decimals, url } = getNetworkInfo(_chain);
  const wsProvider = new WsProvider(url);
  const api = await ApiPromise.create({ provider: wsProvider });
  const stakingAccount = await api.derive.staking.account(_stashAccountId);

  if (!stakingAccount?.redeemable?.gtn(0)) {
    return null;
  }

  return formatBalance(stakingAccount.redeemable, { forceUnit: '-', withSi: false }, decimals);

}

onmessage = (e) => {
  const { address, chain } = e.data;

  // eslint-disable-next-line no-void
  void getRedeemable(chain, address).then((redeemable) => {
    postMessage(redeemable);
  });
};
