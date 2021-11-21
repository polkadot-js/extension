// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { ApiPromise, WsProvider } from '@polkadot/api';
import getNetworkInfo from '@polkadot/extension-ui/util/HackathonUtilFiles/getNetwork';

async function getStackingConsts (_chain) {
  try {
    const { decimals, url } = getNetworkInfo(_chain);

    const wsProvider = new WsProvider(url);
    const api = await ApiPromise.create({ provider: wsProvider });

    const maxNominations = api.consts.staking.maxNominations.toHuman();
    const maxNominatorRewardedPerValidator = api.consts.staking.maxNominatorRewardedPerValidator.toHuman();
    const existentialDeposit = api.consts.balances.existentialDeposit.toHuman();
    const bondingDuration =api.consts.staking.bondingDuration.toHuman()
    const minNominatorBond = await api.query.staking.minNominatorBond();

    // console.log('maxNominations in worker:', maxNominations);
    // console.log('maxNominatorRewardedPerValidator:', maxNominatorRewardedPerValidator);
    // console.log('existentialDeposit:', existentialDeposit);
    console.log('api.consts.staking.bondingDuration:', );

    return {
      bondingDuration: bondingDuration,
      existentialDeposit: existentialDeposit,
      maxNominations: maxNominations,
      maxNominatorRewardedPerValidator: maxNominatorRewardedPerValidator,
      minNominatorBond: Number(minNominatorBond) / (10 ** decimals)
    };
  } catch (error) {
    console.log('something went wrong while getStackingConsts ');

    return null;
  }
}

onmessage = (e) => {
  const { chain } = e.data;

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  getStackingConsts(chain).then((consts) => {
    console.log('getStackingConsts:', consts);
    postMessage(consts);
  });
};
