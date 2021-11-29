// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { ApiPromise, WsProvider } from '@polkadot/api';
import getNetworkInfo from '@polkadot/extension-ui/util/newUtils/getNetwork';

// get all nominated/elected validators of an address
export async function getNominators (_chain, _address) {
  try {
    const { url } = getNetworkInfo(_chain);

    const wsProvider = new WsProvider(url);
    const api = await ApiPromise.create({ provider: wsProvider });

    const nominators = await api.query.staking.nominators(_address);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsedNominators = JSON.parse(JSON.stringify(nominators));

    console.log('#targets', parsedNominators.targets.length);

    return parsedNominators.targets;
  } catch (error) {
    console.log('something went wrong while getting nominators ');

    return null;
  }
}

onmessage = (e) => {
  const { chain, stakerAddress } = e.data;

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  getNominators(chain, stakerAddress).then((targets) => {
    postMessage(targets);
  });
};
