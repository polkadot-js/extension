// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, ChainBondingBasics, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { calculateChainStakedReturn, calculateInflation, calculateValidatorStakedReturn, getCommission, parseBalanceString, ValidatorExtraInfo } from '@subwallet/extension-koni-base/api/bonding/utils';

export async function getChainBondingBasics (networkKey: string, dotSamaApi: ApiProps, decimals: number) {
  const apiProps = await dotSamaApi.isReady;

  const _era = await apiProps.api.query.staking.currentEra();
  const currentEra = _era.toString();

  const [_totalEraStake, _totalIssuance, _auctionCounter, _minBond] = await Promise.all([
    apiProps.api.query.staking.erasTotalStake(parseInt(currentEra)),
    apiProps.api.query.balances.totalIssuance(),
    apiProps.api.query.auctions?.auctionCounter(),
    apiProps.api.query.staking.minNominatorBond()
  ]);

  const rawTotalEraStake = _totalEraStake.toHuman() as string;
  const rawTotalIssuance = _totalIssuance.toHuman() as string;
  const rawMinBond = _minBond.toHuman() as string;
  const numAuctions = _auctionCounter ? _auctionCounter.toHuman() as number : 0;
  const totalIssuance = parseFloat(rawTotalIssuance.replaceAll(',', ''));
  const totalEraStake = parseFloat(rawTotalEraStake.replaceAll(',', ''));

  const inflation = calculateInflation(totalEraStake, totalIssuance, numAuctions, networkKey);
  const stakedReturn = calculateChainStakedReturn(inflation, totalEraStake, totalIssuance, networkKey);
  const minBond = parseFloat(rawMinBond.replaceAll(',', ''));

  return {
    minBond: (minBond / 10 ** decimals),
    stakedReturn
  } as ChainBondingBasics;
}

export async function getValidatorsInfo (networkKey: string, dotSamaApi: ApiProps, decimals: number, nativeToken: string) {
  const apiProps = await dotSamaApi.isReady;

  const _era = await apiProps.api.query.staking.currentEra();
  const currentEra = _era.toString();

  const allValidators: string[] = [];
  const result: ValidatorInfo[] = [];
  let totalEraStake = 0;

  const [_eraStakers, _totalIssuance, _auctionCounter] = await Promise.all([
    apiProps.api.query.staking.erasStakers.entries(parseInt(currentEra)),
    apiProps.api.query.balances.totalIssuance(),
    apiProps.api.query.auctions?.auctionCounter()
  ]);

  const eraStakers = _eraStakers as any[];
  const totalIssuance = _totalIssuance.toHuman() as string;
  const numAuctions = _auctionCounter ? _auctionCounter.toHuman() as number : 0;
  const parsedTotalIssuance = parseFloat(totalIssuance.replaceAll(',', ''));

  for (const item of eraStakers) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const rawValidatorInfo = item[0].toHuman() as any[];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const rawValidatorStat = item[1].toHuman() as Record<string, any>;

    const validatorAddress = rawValidatorInfo[1] as string;
    const rawTotalStake = rawValidatorStat.total as string;
    const rawOwnStake = rawValidatorStat.own as string;

    const parsedTotalStake = parseFloat(rawTotalStake.replaceAll(',', ''));

    totalEraStake += parsedTotalStake;
    const parsedOwnStake = parseFloat(rawOwnStake.replaceAll(',', ''));
    const otherStake = parsedTotalStake - parsedOwnStake;

    const totalStakeString = parseBalanceString(decimals, parsedTotalStake, nativeToken);
    const ownStakeString = parseBalanceString(decimals, parsedOwnStake, nativeToken);
    const otherStakeString = parseBalanceString(decimals, otherStake, nativeToken);

    let nominatorCount = 0;

    if ('others' in rawValidatorStat) {
      const others = rawValidatorStat.others as Record<string, any>[];

      nominatorCount = others.length;
    }

    allValidators.push(validatorAddress);

    result.push({
      rawTotalStake: parsedTotalStake,
      address: validatorAddress,
      totalStake: totalStakeString,
      ownStake: ownStakeString,
      otherStake: otherStakeString,
      nominatorCount,
      // to be added later
      commission: '',
      expectedReturn: 0,
      blocked: false,
      isVerified: false
    });
  }

  const extraInfoMap: Record<string, ValidatorExtraInfo> = {};

  await Promise.all(allValidators.map(async (address) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [_commissionInfo, _identityInfo] = await Promise.all([
      apiProps.api.query.staking.validators(address),
      apiProps.api.query?.identity?.identityOf(address)
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

      if (!displayName.startsWith('0x')) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        identity = identityInfo?.info?.display?.Raw as string;
      } else {
        identity = legal || twitter || web || email || riot;
      }
    }

    extraInfoMap[address] = {
      commission: commissionInfo.commission as string,
      blocked: commissionInfo.blocked as boolean,
      identity,
      isVerified: isReasonable
    } as ValidatorExtraInfo;
  }));

  const inflation = calculateInflation(totalEraStake, parsedTotalIssuance, numAuctions, networkKey);
  const stakedReturn = calculateChainStakedReturn(inflation, totalEraStake, parsedTotalIssuance, networkKey);
  const avgStake = totalEraStake / result.length;

  for (const validator of result) {
    const commission = extraInfoMap[validator.address].commission;

    validator.expectedReturn = calculateValidatorStakedReturn(stakedReturn, validator.rawTotalStake, avgStake, getCommission(commission));
    validator.commission = commission;
    validator.blocked = extraInfoMap[validator.address].blocked;
    validator.identity = extraInfoMap[validator.address].identity;
    validator.isVerified = extraInfoMap[validator.address].isVerified;
  }

  return {
    era: parseInt(currentEra),
    validatorsInfo: result
  };
}
