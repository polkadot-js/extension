// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { ApiPromise, WsProvider } from '@polkadot/api';

import getNetworkInfo from '../getNetwork.ts';
import { amountToHuman } from '../pjpeUtils.ts';

async function getAllValidators (_chain) {
  try {
    const { decimals, url } = getNetworkInfo(_chain);

    const wsProvider = new WsProvider(url);
    const api = await ApiPromise.create({ provider: wsProvider });

    const [elected, waiting, currentEra] = await Promise.all([

      api.derive.staking.electedInfo({ withController: true, withDestination: true, withExposure: true, withPrefs: true, withNominations: true, withLedger: true }),
      api.derive.staking.waitingInfo({ withController: true, withDestination: true, withExposure: true, withPrefs: true, withNominations: true, withLedger: true }),
      api.query.staking.currentEra()
    ]);

    console.log(`Got all validators elected ${elected?.info.length} waiting:${waiting?.info.length}`);

    let nextElectedInfo = elected.info.filter((e) =>
      elected.nextElected.find((ne) =>
        String(ne) === String(e.accountId)
      ));

    nextElectedInfo = JSON.parse(JSON.stringify(nextElectedInfo));
    nextElectedInfo = nextElectedInfo.map((nei) => {
      nei.exposure.own = amountToHuman(nei.exposure.own, decimals);
      nei.exposure.total = amountToHuman(nei.exposure.total, decimals);
      nei.stakingLedger.active = amountToHuman(nei.stakingLedger.active, decimals);
      nei.stakingLedger.total = amountToHuman(nei.stakingLedger.total, decimals);

      return nei;
    });

    let waitingInfo = JSON.parse(JSON.stringify(waiting.info));

    waitingInfo = waitingInfo.map((wi) => {
      wi.exposure.own = amountToHuman(wi.exposure.own, decimals);
      wi.exposure.total = amountToHuman(wi.exposure.total, decimals);
      wi.stakingLedger.active = amountToHuman(wi.stakingLedger.active, decimals);
      wi.stakingLedger.total = amountToHuman(wi.stakingLedger.total, decimals);

      return wi;
    });

    // eslint-disable-next-line sort-keys
    const output = JSON.parse(JSON.stringify({ current: nextElectedInfo, waiting: waitingInfo, currentEraIndex: currentEra.toHuman() }));

    // console.log('a sample current validator:', nextElectedInfo[0]);
    // console.log('a sample waiting validator:', waitingInfo[0]);

    return output;
  } catch (error) {
    console.log('something went wrong while getting validators info, err:', error);

    return null;
  }
}

onmessage = (e) => {
  const { chain } = e.data;

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  getAllValidators(chain).then((info) => {
    console.log('getAllValidators info in worker:', info);
    postMessage(info);
  });
};
