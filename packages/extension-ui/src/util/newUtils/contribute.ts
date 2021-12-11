// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { ApiPromise, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';

import getNetworkInfo from './getNetwork';
import { TxInfo } from './pjpeTypes';
import { signAndSend } from './signAndSend';

export default async function contribute(
  _signer: KeyringPair,
  _paraId: string,
  _amount: bigint,
  _chainName: string): Promise<TxInfo> {
  const { url } = getNetworkInfo(null, _chainName);
  const wsProvider = new WsProvider(url);
  const api = await ApiPromise.create({ provider: wsProvider });

  try {
    if (!_amount) {
      console.log('cotribute value:', _amount);

      return { status: 'failed' };
    }

    console.log(`contributing  ${_amount} to ${_paraId}`);

    const contributed = api.tx.crowdloan.contribute(_paraId, _amount, null);

    return signAndSend(api, contributed, _signer);
  } catch (e) {
    console.log('something went wrong while nominating', e);

    return { status: 'failed' };
  }
}