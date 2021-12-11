/* eslint-disable camelcase */
// [object Object]
// SPDX-License-Identifier: Apache-2.0
// eslint-disable-next-line header/header
import { ApiPromise, WsProvider } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { Chain } from '@polkadot/extension-chains/types';
import { KeyringPair } from '@polkadot/keyring/types';
import { ISubmittableResult } from '@polkadot/types/types';

import getNetworkInfo from './getNetwork';
import { TxInfo, ValidatorsFromSubscan } from './pjpeTypes';
import { postData } from './postData';
import { signAndSend } from './signAndSend';

export async function getAllValidatorsFromSubscan(_chain: Chain): Promise<{ current: ValidatorsFromSubscan[] | null, waiting: ValidatorsFromSubscan[] | null } | null> {
  if (!_chain) {
    return null;
  }

  const allInfo = await Promise.all([
    getCurrentValidatorsFromSubscan(_chain),
    getWaitingValidatorsFromSubscan(_chain)
  ]);

  // let current: any = [];

  // allInfo[0]?.forEach((v) => {
  //   current.push({
  //     accountId: v.stash_account_display.address,//can remove
  //     controllerAccount: {
  //       accountIndex: v.controller_account_display?.account_index,
  //       address: v.controller_account_display?.address,
  //       display: v.controller_account_display?.display,
  //       identity: v.controller_account_display?.identity,
  //       judgements: v.controller_account_display?.judgements,
  //       parent: v.controller_account_display?.parent
  //     },
  //     stashAccount: {
  //       accountIndex: v.stash_account_display.account_index,
  //       address: v.stash_account_display.address,
  //       display: v.stash_account_display.display,
  //       identity: v.stash_account_display.identity,
  //       judgements: v.stash_account_display.judgements,
  //       parent: v.stash_account_display.parent
  //     },
  //     exposure: {
  //       total: v.bonded_total,
  //       own: v.bonded_owner,
  //       others: [],
  //       bondedNominators: v.bonded_nominators,
  //       countNominators: v.count_nominators
  //     },
  //     nominators: [],
  //     rewardDestination: {},
  //     stakingLedger: {
  //       stash: v.stash_account_display.address,
  //       total: null,
  //       active: null,
  //       unlocking: [],
  //       claimedRewards: [],
  //     },
  //     validatorPrefs: {
  //       commission: v.validator_prefs_value,
  //       blocked: null
  //     },
  //     grandpaVote: v.grandpa_vote,
  //     latestMining: v.latest_mining,
  //     nodeName: v.node_name,
  //     rankValidator: v.rank_validator,
  //     rewardAccount: v.reward_account,
  //     rewardPoint: v.reward_point,
  //     rewardPotBalance: v.reward_pot_balance,
  //     sessionKey: v.session_key
  //   });
  // });

  // let waiting: any = [];

  // allInfo[1]?.forEach((v) => {
  //   waiting.push({
  //     accountId: v.stash_account_display.address,//can remove
  //     controllerAccount: {
  //       accountIndex: v.controller_account_display?.account_index,
  //       address: v.controller_account_display?.address,
  //       display: v.controller_account_display?.display,
  //       identity: v.controller_account_display?.identity,
  //       judgements: v.controller_account_display?.judgements,
  //       parent: v.controller_account_display?.parent
  //     },
  //     stashAccount: {
  //       accountIndex: v.stash_account_display.account_index,
  //       address: v.stash_account_display.address,
  //       display: v.stash_account_display.display,
  //       identity: v.stash_account_display.identity,
  //       judgements: v.stash_account_display.judgements,
  //       parent: v.stash_account_display.parent
  //     },
  //     exposure: {
  //       total: v.bonded_total,
  //       own: v.bonded_owner,
  //       others: [],
  //       bondedNominators: v.bonded_nominators,
  //       countNominators: v.count_nominators
  //     },
  //     nominators: [],
  //     rewardDestination: {},
  //     stakingLedger: {
  //       stash: v.stash_account_display.address,
  //       total: null,
  //       active: null,
  //       unlocking: [],
  //       claimedRewards: [],
  //     },
  //     validatorPrefs: {
  //       commission: v.validator_prefs_value,
  //       blocked: null
  //     },
  //     grandpaVote: v.grandpa_vote,
  //     latestMining: v.latest_mining,
  //     nodeName: v.node_name,
  //     rankValidator: v.rank_validator,
  //     rewardAccount: v.reward_account,
  //     rewardPoint: v.reward_point,
  //     rewardPotBalance: v.reward_pot_balance,
  //     sessionKey: v.session_key
  //   });
  // });

  // console.log(current, waiting);

  return { current: allInfo[0], waiting: allInfo[1] };
}

export async function getCurrentValidatorsFromSubscan(_chain: Chain):
  Promise<ValidatorsFromSubscan[] | null> {
  return new Promise((resolve) => {
    try {
      const network = _chain.name.replace(' Relay Chain', '');

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      postData(
        'https://' + network + '.api.subscan.io/api/scan/staking/validators',
        {}
      ).then((data: { message: string; data: { count: number, list: ValidatorsFromSubscan[] | null; }; }) => {
        if (data.message === 'Success') {
          const validators = data.data.list;

          resolve(validators);
        } else {
          console.log(`Fetching message ${data.message}`);
          resolve(null);
        }
      });
    } catch (error) {
      console.log('something went wrong while getting getCurrentValidators ');
      resolve(null);
    }
  });
}

export async function getWaitingValidatorsFromSubscan(_chain: Chain): Promise<ValidatorsFromSubscan[] | null> {
  return new Promise((resolve) => {
    try {
      const network = _chain ? _chain.name.replace(' Relay Chain', '') : 'westend';

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      postData('https://' + network + '.api.subscan.io/api/scan/staking/waiting', { key: 20 })
        .then((data: { message: string; data: { count: number, list: ValidatorsFromSubscan[] | null; }; }) => {
          console.log(data);

          if (data.message === 'Success') {
            const validators = data.data.list;

            resolve(validators);
          } else {
            console.log(`Fetching message ${data.message}`);
            resolve(null);
          }
        });
    } catch (error) {
      console.log('something went wrong while getting getWaitinValidators, err: ', error);
      resolve(null);
    }
  });
}

export async function getBonded(_chain: Chain, _address: string): Promise<ValidatorsFromSubscan[] | null> {
  return new Promise((resolve) => {
    try {
      const network = _chain ? _chain.name.replace(' Relay Chain', '') : 'westend';

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      postData('https://' + network + '.api.subscan.io/api/wallet/bond_list',
        {
          // key: 21,
          // page: 1,
          status: 'bonded',
          address: _address
        })

        .then((data: any
          // : { message: string; data: { count: number, list: ValidatorsFromSubscan[] | null; }; }
        ) => {
          console.log('getBonded', data);

          // if (data.message === 'Success') {
          //   const validators = data.data.list;

          //   resolve(validators);
          // } else {
          //   console.log(`Fetching message ${data.message}`);
          //   resolve(null);
          // }
        });
    } catch (error) {
      console.log('something went wrong while getting getWaitinValidators, err: ', error);
      resolve(null);
    }
  });
}

export async function getStakingReward(_chain: Chain | null | undefined, _stakerAddress: string | null): Promise<string | null> {
  if (!_stakerAddress) {
    console.log('_stakerAddress is null in getting getStakingReward ');

    return null;
  }

  return new Promise((resolve) => {
    try {
      const network = _chain ? _chain.name.replace(' Relay Chain', '') : 'westend';

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      postData('https://' + network + '.api.subscan.io/api/scan/staking_history',
        {
          address: _stakerAddress,
          page: 0,
          row: 20
        })
        .then((data: { message: string; data: { sum: string; }; }) => {
          if (data.message === 'Success') {
            const reward = data.data.sum;

            console.log('# reward:', reward);

            resolve(reward);
          } else {
            console.log(`Fetching message ${data.message}`);
            resolve(null);
          }
        });
    } catch (error) {
      console.log('something went wrong while getting getStakingReward ');
      resolve(null);
    }
  });
}



export async function unbond(
  _chain: Chain | null | undefined,
  _controllerAccountId: string | null,
  _signer: KeyringPair,
  _value: bigint): Promise<TxInfo> {
  try {
    console.log('unbond is called!');

    if (!_controllerAccountId) {
      console.log('unbond:  _controllerAccountId is empty!');

      return { status: 'failed' };
    }

    const { url } = getNetworkInfo(_chain);

    const wsProvider = new WsProvider(url);
    const api = await ApiPromise.create({ provider: wsProvider });

    const unbonded = api.tx.staking.unbond(_value);

    return signAndSend(api, unbonded, _signer);
  } catch (error) {
    console.log('Something went wrong while unbond', error);

    return { status: 'failed' };
  }
}

export async function nominate(
  _chain: Chain | null | undefined,
  _stashAccountId: string | null,
  _signer: KeyringPair,
  _selectedValidators: string[] | null)
  : Promise<TxInfo> {
  try {
    if (!_stashAccountId || !_selectedValidators || !_chain) {
      console.log('Nominate: validators, controller, or chain is empty!');

      return { status: 'failed' };
    }

    const { url } = getNetworkInfo(_chain);

    const wsProvider = new WsProvider(url);
    const api = await ApiPromise.create({ provider: wsProvider });
    const nominated = api.tx.staking.nominate(_selectedValidators);

    return signAndSend(api, nominated, _signer);
  } catch (error) {
    console.log('Something went wrong while bond/nominate', error);

    return { status: 'failed' };
  }
}

export async function getCurrentEraIndex(_chain: Chain | null | undefined): Promise<number | null> {
  try {
    console.log('getCurrentEraIndex is called!');

    if (!_chain) {
      console.log('no _chain in getCurrentEraIndex');

      return null;
    }

    const { url } = getNetworkInfo(_chain);
    const wsProvider = new WsProvider(url);
    const api = await ApiPromise.create({ provider: wsProvider });

    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      api.query.staking.currentEra().then((index) => {
        resolve(Number(index));
      });
    });
  } catch (error) {
    console.log('Something went wrong while bond/nominate', error);

    return null;
  }
}

export async function bondOrBondExtra(
  _chain: Chain | null | undefined,
  _stashAccountId: string | null,
  _signer: KeyringPair,
  _value: bigint,
  _alreadyBondedAmount: bigint,
  payee = 'Staked')
  : Promise<TxInfo> {
  try {
    console.log('bondOrBondExtra is called!');

    if (!_stashAccountId) {
      console.log('bondOrBondExtra:  controller is empty!');

      return { status: 'failed' };
    }

    /** payee:
     * Staked - Pay into the stash account, increasing the amount at stake accordingly.
     * Stash - Pay into the stash account, not increasing the amount at stake.
     * Account - Pay into a custom account.
     * Controller - Pay into the controller account.
     */
    const { url } = getNetworkInfo(_chain);

    const wsProvider = new WsProvider(url);
    const api = await ApiPromise.create({ provider: wsProvider });
    let bonded: SubmittableExtrinsic<'promise', ISubmittableResult>;

    if (Number(_alreadyBondedAmount) > 0) {
      bonded = api.tx.staking.bondExtra(_value);
    } else {
      bonded = api.tx.staking.bond(_stashAccountId, _value, payee);
    }

    return signAndSend(api, bonded, _signer);
  } catch (error) {
    console.log('Something went wrong while bond/nominate', error);

    return { status: 'failed' };
  }
}

export async function chill(
  _chain: Chain | null | undefined,
  _controllerId: string | null,
  _signer: KeyringPair): Promise<TxInfo> {
  try {
    console.log('chill is called!');

    if (!_controllerId) {
      console.log('chill:  controller is empty!');

      return { status: 'failed' };
    }

    const { url } = getNetworkInfo(_chain);
    const wsProvider = new WsProvider(url);
    const api = await ApiPromise.create({ provider: wsProvider });
    const chilled = api.tx.staking.chill();

    return signAndSend(api, chilled, _signer);
  } catch (error) {
    console.log('Something went wrong while chill', error);

    return { status: 'failed' };
  }
}

export async function withdrawUnbonded(
  _chain: Chain | null | undefined,
  _controllerId: string | null,
  _signer: KeyringPair): Promise<TxInfo> {
  try {
    console.log('withdrawUnbonded is called!');

    if (!_controllerId) {
      console.log('withdrawUnbonded:  controller is empty!');

      return { status: 'failed' };
    }

    const { url } = getNetworkInfo(_chain);
    const wsProvider = new WsProvider(url);
    const api = await ApiPromise.create({ provider: wsProvider });

    const optSpans = await api.query.staking.slashingSpans(_controllerId);
    const spanCount = optSpans.isNone ? 0 : optSpans.unwrap().prior.length + 1;

    const withdraw = api.tx.staking.withdrawUnbonded(spanCount || 0);

    return signAndSend(api, withdraw, _signer);
  } catch (error) {
    console.log('Something went wrong while withdrawUnbonded', error);

    return { status: 'failed' };
  }
}
