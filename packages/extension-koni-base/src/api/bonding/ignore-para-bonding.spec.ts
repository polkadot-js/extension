// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { DOTSAMA_AUTO_CONNECT_MS } from '@subwallet/extension-koni-base/constants';
import { getCurrentProvider } from '@subwallet/extension-koni-base/utils/utils';

import { ApiPromise, WsProvider } from '@polkadot/api';
import {BN} from "@polkadot/util";

jest.setTimeout(50000);

interface CollatorInfo {
  owner: string;
  amount: string;
}

function calculateChainStakedReturn (inflation: number, totalEraStake: number, totalIssuance: number, networkKey: string) {
  const stakedFraction = totalEraStake / totalIssuance;
  let stakedReturn = inflation / stakedFraction;

  if (networkKey === 'aleph') {
    stakedReturn *= 0.9; // 10% goes to treasury
  }

  return stakedReturn;
}

interface ValidatorInfo {
  address: string;
  totalStake: number;
  ownStake: number;
  otherStake: number;
  nominatorCount: number;
  commission: number;
  expectedReturn: number;
  blocked: boolean;
  identity?: string;
  isVerified: boolean;
  minBond: number;
  isNominated: boolean; // this validator has been staked to before
}

interface CollatorExtraInfo {
  active: boolean,
  identity?: string,
  isVerified: boolean,
  delegationCount: number,
  bond: number,
  minDelegation: number
}

function parseRawNumber (value: string) {
  return parseFloat(value.replaceAll(',', ''));
}

describe('test DotSama APIs', () => {
  test('test get Validator', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.moonbeam), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;
    const decimals = PREDEFINED_NETWORKS.moonbeam.decimals as number;
    const address = '0xf71C6143917BD7DaC2572BCF2bd456B0AaE3Fb2c';

    const allValidators: ValidatorInfo[] = [];

    const [_allCollators, _delegatorState] = await Promise.all([
      apiPromise.query.parachainStaking.candidatePool(),
      apiPromise.query.parachainStaking.delegatorState(address)
    ]);

    const _maxDelegatorPerCandidate = apiPromise.consts.parachainStaking.maxTopDelegationsPerCandidate.toHuman() as string;
    const maxDelegatorPerCandidate = parseRawNumber(_maxDelegatorPerCandidate);

    const _maxDelegation = apiPromise.consts.parachainStaking.maxDelegationsPerDelegator.toHuman() as string;
    const maxDelegations = parseRawNumber(_maxDelegation);

    const rawDelegatorState = _delegatorState.toHuman() as Record<string, any> | null;
    const rawAllCollators = _allCollators.toHuman() as unknown as CollatorInfo[];

    for (const collator of rawAllCollators) {
      allValidators.push({
        address: collator.owner,
        totalStake: parseRawNumber(collator.amount) / 10 ** decimals,
        ownStake: 0,
        otherStake: 0,
        nominatorCount: 0,
        commission: -1,
        expectedReturn: 0,
        blocked: false,
        isVerified: false,
        minBond: 0,
        isNominated: false
      });
    }

    const bondedValidators: string[] = [];

    if (rawDelegatorState !== null) {
      const validatorList = rawDelegatorState.delegations as Record<string, any>[];

      for (const _validator of validatorList) {
        bondedValidators.push(_validator.owner as string);
      }
    }

    const extraInfoMap: Record<string, CollatorExtraInfo> = {};

    await Promise.all(allValidators.map(async (validator) => {
      const [_info, _identity] = await Promise.all([
        apiPromise.query.parachainStaking.candidateInfo(validator.address),
        apiPromise.query.identity.identityOf(validator.address)
      ]);

      const rawInfo = _info.toHuman() as Record<string, any>;
      const rawIdentity = _identity.toHuman() as Record<string, any> | null;

      const bond = parseRawNumber(rawInfo?.bond as string);
      const delegationCount = parseRawNumber(rawInfo?.delegationCount as string);
      const minDelegation = parseRawNumber(rawInfo?.lowestTopDelegationAmount as string);
      const active = rawInfo?.status === 'Active';

      let isReasonable = false;
      let identity;

      if (rawIdentity !== null) {
        // Check if identity is eth address
        const _judgements = rawIdentity.judgements as any[];

        if (_judgements.length > 0) {
          isReasonable = true;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const displayName = rawIdentity?.info?.display?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const legal = rawIdentity?.info?.legal?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const web = rawIdentity?.info?.web?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const riot = rawIdentity?.info?.riot?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const email = rawIdentity?.info?.email?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const twitter = rawIdentity?.info?.twitter?.Raw as string;

        if (displayName && !displayName.startsWith('0x')) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          identity = displayName;
        } else if (legal && !legal.startsWith('0x')) {
          identity = legal;
        } else {
          identity = twitter || web || email || riot;
        }
      }

      extraInfoMap[validator.address] = {
        identity,
        isVerified: isReasonable,
        bond: bond / 10 ** decimals,
        minDelegation: minDelegation / 10 ** decimals,
        delegationCount,
        active
      } as CollatorExtraInfo;
    }));

    for (const validator of allValidators) {
      if (bondedValidators.includes(validator.address)) {
        validator.isNominated = true;
      }

      validator.minBond = extraInfoMap[validator.address].minDelegation;
      validator.ownStake = extraInfoMap[validator.address].bond;
      validator.blocked = !extraInfoMap[validator.address].active;
      validator.identity = extraInfoMap[validator.address].identity;
      validator.isVerified = extraInfoMap[validator.address].isVerified;
      validator.otherStake = validator.totalStake - validator.ownStake;
      validator.nominatorCount = extraInfoMap[validator.address].delegationCount;
    }

    // TODO: calculate validator returns

    console.log(maxDelegations);
    console.log(maxDelegatorPerCandidate);
    console.log(allValidators);
  });

  test('get chain APY', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.moonbeam), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;

    const totalStake = await apiPromise.query.parachainStaking.total();
    const _totalStake = totalStake.toHuman() as string;
    const parsedTotalStake = parseFloat(_totalStake.replaceAll(',', ''));

    const totalIssuance = await apiPromise.query.balances.totalIssuance();
    const _totalIssuance = totalIssuance.toHuman() as string;
    const parsedTotalIssuance = parseFloat(_totalIssuance.replaceAll(',', ''));

    const stakedReturn = calculateChainStakedReturn(2.5, parsedTotalStake, parsedTotalIssuance, 'moonbeam');

    const _inflation = (await apiPromise.query.parachainStaking.inflationConfig()).toHuman() as Record<string, Record<string, any>>;
    const inflationString = _inflation.annual.ideal as string;
    const inflation = parseFloat(inflationString.split('%')[0]);

    console.log(inflation);

    console.log(stakedReturn); // might or might not be right
  });

  test('get bonding extrinsic', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.moonbeam), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;

    const extrinsic = apiPromise.tx.parachainStaking.delegate('0x0198D3053a69C3f977bB1943bc95A0fFA7777474', new BN(6), 336, 0);

    // TODO: get delegatorCount and bondedInfo
    const fee = await extrinsic.paymentInfo('0xAF2b4242e766caf5791DA56723a8dE1BeA4e7098');

    console.log(fee.toHuman());
  });
});
