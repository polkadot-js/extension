// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { ApiPromise, WsProvider } from '@polkadot/api';
import getNetworkInfo from '@polkadot/extension-ui/util/HackathonUtilFiles/getNetwork';

async function getLedger (_address, _chain) {
  if (!_address) {
    return null;
  }

  const defaultOutput = {
    active: 0n,
    claimedRewards: [],
    stash: '',
    total: 0n,
    unlocking: []
  };

  const { url } = getNetworkInfo(_chain);

  const wsProvider = new WsProvider(url);
  const api = await ApiPromise.create({ provider: wsProvider });

  const data = await api.query.staking.ledger(_address);

  // console.log('get ledger data:');
  // console.log(data);

  if (data.toString() == '') {
    return defaultOutput;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return JSON.parse(data.toString());
}

onmessage = (e) => {
  const { address, chain } = e.data;

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  getLedger(address, chain).then((ledger) => {
    postMessage(ledger);
  });
};
