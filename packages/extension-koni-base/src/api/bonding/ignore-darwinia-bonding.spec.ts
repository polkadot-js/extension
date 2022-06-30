// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { calculateChainStakedReturn, calculateInflation, calculateValidatorStakedReturn, getCommission, ValidatorExtraInfo } from '@subwallet/extension-koni-base/api/bonding/utils';
import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { DOTSAMA_AUTO_CONNECT_MS } from '@subwallet/extension-koni-base/constants';
import { getCurrentProvider } from '@subwallet/extension-koni-base/utils/utils';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { BN } from '@polkadot/util';

jest.setTimeout(50000);

describe('test DotSama APIs', () => {
  test('test get Validator', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.pangolin), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;
    const address = '5DLiz4E7znANe9LMWyFHPQvmdhSgdJeoJdgtFtEZ8c3TeBan';
    const decimals = 9;

    const _era = await apiPromise.query.staking.currentEra();
    const currentEra = _era.toString();

    const allValidators: string[] = [];
    const result: ValidatorInfo[] = [];
    let totalEraStake = 0;

    const [_eraStakers, _totalIssuance, _auctionCounter, _minBond, _existedValidators, _bondedInfo] = await Promise.all([
      apiPromise.query.staking.erasStakers.entries(parseInt(currentEra)),
      apiPromise.query.balances.totalIssuance(),
      apiPromise.query.auctions?.auctionCounter(),
      apiPromise.query.staking.minNominatorBond(),
      apiPromise.query.staking.nominators(address),
      apiPromise.query.staking.bonded(address)
    ]);

    const rawMaxNominations = (apiPromise.consts.staking.maxNominations).toHuman() as string;
    const maxNominations = parseFloat(rawMaxNominations.replaceAll(',', ''));
    const rawMaxNominatorPerValidator = (apiPromise.consts.staking.maxNominatorRewardedPerValidator).toHuman() as string;
    const maxNominatorPerValidator = parseFloat(rawMaxNominatorPerValidator.replaceAll(',', ''));

    const bondedInfo = _bondedInfo.toHuman();
    const rawExistedValidators = _existedValidators.toHuman() as Record<string, any>;
    const bondedValidators = rawExistedValidators ? rawExistedValidators.targets as string[] : [];
    const eraStakers = _eraStakers as any[];
    const totalIssuance = _totalIssuance.toHuman() as string;
    const numAuctions = _auctionCounter ? _auctionCounter.toHuman() as number : 0;
    const parsedTotalIssuance = parseFloat(totalIssuance.replaceAll(',', ''));

    const rawMinBond = _minBond.toHuman() as string;
    const minBond = parseFloat(rawMinBond.replaceAll(',', ''));

    const totalStakeMap: Record<string, number> = {};

    for (const item of eraStakers) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const rawValidatorInfo = item[0].toHuman() as any[];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const rawValidatorStat = item[1].toHuman() as Record<string, any>;

      const validatorAddress = rawValidatorInfo[1] as string;
      const rawTotalStake = rawValidatorStat.totalPower as string;
      const rawOwnStake = rawValidatorStat.ownPower as string;

      const parsedTotalStake = parseFloat(rawTotalStake.replaceAll(',', ''));

      totalStakeMap[validatorAddress] = parsedTotalStake;

      totalEraStake += parsedTotalStake;
      const parsedOwnStake = parseFloat(rawOwnStake.replaceAll(',', ''));
      const otherStake = parsedTotalStake - parsedOwnStake;

      let nominatorCount = 0;

      if ('others' in rawValidatorStat) {
        const others = rawValidatorStat.others as Record<string, any>[];

        nominatorCount = others.length;
      }

      allValidators.push(validatorAddress);

      result.push({
        address: validatorAddress,
        totalStake: parsedTotalStake,
        ownStake: parsedOwnStake,
        otherStake: otherStake,
        nominatorCount,
        // to be added later
        commission: 0,
        expectedReturn: 0,
        blocked: false,
        isVerified: false,
        minBond: (minBond / 10 ** decimals),
        isNominated: bondedValidators.includes(validatorAddress)
      } as ValidatorInfo);
    }

    const extraInfoMap: Record<string, ValidatorExtraInfo> = {};

    await Promise.all(allValidators.map(async (address) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const [_commissionInfo, _identityInfo] = await Promise.all([
        apiPromise.query.staking.validators(address),
        apiPromise.query?.identity?.identityOf(address)
      ]);

      const commissionInfo = _commissionInfo.toHuman() as Record<string, any>;
      const identityInfo = _identityInfo ? (_identityInfo.toHuman() as Record<string, any> | null) : null;
      let isReasonable = false;
      let identity;

      if (identityInfo !== null) {
        // Check if identity is eth address
        const _judgements = identityInfo.judgements as any[];

        if (_judgements.length > 0) {
          isReasonable = true;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const displayName = identityInfo?.info?.display?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const legal = identityInfo?.info?.legal?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const web = identityInfo?.info?.web?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const riot = identityInfo?.info?.riot?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const email = identityInfo?.info?.email?.Raw as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const twitter = identityInfo?.info?.twitter?.Raw as string;

        if (displayName && !displayName.startsWith('0x')) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          identity = displayName;
        } else if (legal && !legal.startsWith('0x')) {
          identity = legal;
        } else {
          identity = twitter || web || email || riot;
        }
      }

      extraInfoMap[address] = {
        commission: commissionInfo.commission as string,
        blocked: commissionInfo.blocked as boolean,
        identity,
        isVerified: isReasonable
      } as ValidatorExtraInfo;
    }));

    const inflation = calculateInflation(totalEraStake, parsedTotalIssuance, numAuctions, 'pangolin');
    const stakedReturn = calculateChainStakedReturn(inflation, totalEraStake, parsedTotalIssuance, 'pangolin');
    const avgStake = totalEraStake / result.length;

    for (const validator of result) {
      const commission = extraInfoMap[validator.address].commission;

      validator.expectedReturn = calculateValidatorStakedReturn(stakedReturn, totalStakeMap[validator.address], avgStake, getCommission(commission));
      validator.commission = parseFloat(commission.split('%')[0]);
      validator.blocked = extraInfoMap[validator.address].blocked;
      validator.identity = extraInfoMap[validator.address].identity;
      validator.isVerified = extraInfoMap[validator.address].isVerified;
    }

    return {
      maxNominatorPerValidator,
      era: parseInt(currentEra),
      validatorsInfo: result,
      isBondedBefore: bondedInfo !== null,
      bondedValidators,
      maxNominations
    };
  });

  test('test get bonding extrinsic', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.pangolin), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;
    const address = '5DLiz4E7znANe9LMWyFHPQvmdhSgdJeoJdgtFtEZ8c3TeBan';

    const extrinsic = apiPromise.tx.staking.bond(address, { RingBalance: new BN(1), KtonBalance: new BN(0) }, 'Staked', new BN(0));

    console.log(extrinsic.paymentInfo(address));
  });
});
