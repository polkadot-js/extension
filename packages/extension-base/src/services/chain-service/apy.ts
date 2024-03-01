import { ApiPromise, WsProvider } from "@polkadot/api";
import { decodeAddress, encodeAddress } from "@polkadot/keyring";
import { hexToU8a, isHex, BN } from "@polkadot/util";
import "@polkadot/api-augment";

const BLOCKS_PER_ROUND = 1800; // each round has 1800 blocks
const POINTS_PER_BLOCK = 20; // producing 1 block will get 20 points
const MIN_DELEGATION = 500; // staking 500 manta at least

class Collator {
  address: String;
  delegationCount: number;
  balanceSelfBonded: number;
  balanceEffectiveBonded: number;
  minStake: number;
  blocksPreviousRound: number;
  isActive: Boolean;
  isFunctionallyActive: Boolean;

  constructor(
    address,
    balanceSelfBonded,
    balanceEffectiveBonded,
    delegationCount,
    minStake,
    isActive,
    blocksPreviousRound
  ) {
    this.address = address;
    this.delegationCount = delegationCount;
    this.balanceSelfBonded = balanceSelfBonded;
    this.balanceEffectiveBonded = balanceEffectiveBonded;
    this.minStake = minStake;
    this.blocksPreviousRound = blocksPreviousRound;
    // Whether the collator is active according to on-chain data
    // i.e. whether the collator is part of the set of collators permitted to produce blocks
    this.isActive = isActive;
    // Whether the collator is active for the purposes of end users
    // i.e. whether the collator is actually producing blocks
    this.isFunctionallyActive = this._getIsFunctionallyActive();
  }

  _getIsFunctionallyActive() {
    return this.isActive && this.blocksPreviousRound > 0;
  }
}

async function createPromiseApi(nodeAddress: string) {
  const wsProvider = new WsProvider(nodeAddress);

  const api = new ApiPromise({
    provider: wsProvider,
  });
  await api.isReady;
  console.log(`${nodeAddress} has been started`);
  return api;
}

async function factor(api: ApiPromise) {
  const decimal = api.registry.chainDecimals;
  const factor = new BN(10).pow(new BN(decimal));
  return factor;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toUnit(amount: BN, factor: BN) {
  return amount.div(factor).toNumber();
}

const getTotalIssuance = async (api, factor) => {
  const totalIssuanceRaw = await api.query.balances.totalIssuance();
  return toUnit(new BN(totalIssuanceRaw), factor);
};

const getAnnualInflation = async (api, factor) => {
  const totalIssuance = await getTotalIssuance(api, factor);
  const inflationConfig = await api.query.parachainStaking.inflationConfig();
  const annualInflationPercent =
    inflationConfig.annual.ideal.toHuman().slice(0, -1) / 100;
  const annualInflation = totalIssuance * annualInflationPercent;

  return annualInflation;
};

const getCollatorCommission = async (api) => {
  const collatorCommissionRaw = await api.query.parachainStaking.collatorCommission();
  return collatorCommissionRaw.toHuman().slice(0, -1) / 100;
};

const getRoundInfo = async (api) => {
  const roundInfo = await api.parachainStaking.round();
};

const getCollatorsAreActive = async (api, collatorAddresses) => {
  const activeCollators = (await api.query.parachainStaking.selectedCandidates()).map((collator) => collator.toString());
  return collatorAddresses.map((address) => activeCollators.includes(address));
};

const getBlocksPreviousRound = async (api, round, collatorAddresses) => {
  if (round.current === 0) {
    return 0;
  }
  const args = collatorAddresses.map((address) => [round.current - 1, address]);
  const pointsPreviousRoundRaw = await api.query.parachainStaking.awardedPts.multi(args);
  // producing 1 block will get 20 points
  // how many blocks this collator produces in last round
  return pointsPreviousRoundRaw.map(
    (pointsRaw) => pointsRaw.toNumber() / POINTS_PER_BLOCK
  );
};

const getCollatorCandidateInfo = async (api, collatorAddresses, factor) => {
  const statsListRaw = await api.query.parachainStaking.candidateInfo.multi(
    collatorAddresses
  );
  return statsListRaw
    .filter((candidateInfo) => !candidateInfo.isNone)
    .map((candidateInfo) => {
      return {
        balanceSelfBonded: toUnit(
          new BN(candidateInfo.value.bond.toString()),
          factor
        ),
        balanceEffectiveBonded: toUnit(
          new BN(candidateInfo.value.totalCounted.toString()),
          factor
        ),
        delegationCount: candidateInfo.value.delegationCount.toNumber(),
        lowestTopDelegationAmount: toUnit(
          new BN(candidateInfo.value.lowestTopDelegationAmount.toString()),
          factor
        ),
      };
    });
};

const getMinStake = (lowestTopDelegationAmount, delegationCount) => {
  if (delegationCount < 100) {
    return MIN_DELEGATION;
  }
  return lowestTopDelegationAmount + 1;
};

const deductCollatorCommission = (apy, collatorComission) => {
  const apyLessComission = (1 - collatorComission) * apy;
  return apyLessComission;
};

const calculateApyForSingleCollator = (collator, annualRewardsPerCollatorAtomicUnits, arginalDelegationAtomicUnits, collatorComission, collatorExpectedBlocksPerRound) => {
  const collatorDelegationValueAtomicUnits =
    collator.balanceEffectiveBonded + marginalDelegationAtomicUnits;

  const marginalDelegationProportion =
    marginalDelegationAtomicUnits / collatorDelegationValueAtomicUnits;

  const marginalRewardAtomicUnits =
    annualRewardsPerCollatorAtomicUnits * marginalDelegationProportion;

  const performanceAdjustmentFactor =
    collator.blocksPreviousRound / collatorExpectedBlocksPerRound;

  let apy =
    (100 * performanceAdjustmentFactor * marginalRewardAtomicUnits) /
    marginalDelegationAtomicUnits;
  apy = deductCollatorCommission(Math.round(apy), collatorComission);
  console.log(`${collator.address}'s apy is: ${Math.round(apy)}%`);
};

const calculateApyForAllCollators = async (api) => {
  const decimal = api.registry.chainDecimals;
  const factor = new BN(10).pow(new BN(decimal));

  // get all current collators
  const allCollators = (await api.query.parachainStaking.candidatePool()).map((candidate) => candidate.owner.toString());

  // filter collators who don't join in last round
  const activeCollators = await getCollatorsAreActive(api, allCollators);

  // round info
  const round = await api.query.parachainStaking.round();
  const blocksPreviousRound = await getBlocksPreviousRound(api, round, allCollators);
  const collatorCommission = await getCollatorCommission(api);

  const collatorCandidatesInfo = await getCollatorCandidateInfo(api, allCollators, factor);

  const collatorCandidates = [];
  for (let i = 0; i < activeCollators.length; i++) {
    const collator = new Collator(
      allCollators[i],
      collatorCandidatesInfo[i].balanceSelfBonded,
      collatorCandidatesInfo[i].balanceEffectiveBonded,
      collatorCandidatesInfo[i].delegationCount,
      getMinStake(
        collatorCandidatesInfo[i].lowestTopDelegationAmount,
        collatorCandidatesInfo[i].delegationCount
      ),
      activeCollators[i],
      blocksPreviousRound[i]
    );
    collatorCandidates.push(collator);
  }

  const annualInflation = await getAnnualInflation(api, factor);
  const totalActiveCollators = collatorCandidates.filter(
    (collator) => collator.isActive
  ).length;
  if (totalActiveCollators === 0) {
    return;
  }
  const annualRewardsPerCollator = annualInflation / totalActiveCollators;
  const marginalDelegation = 500;

  const collatorExpectedBlocksPerRound =
    round.length.toNumber() / collatorCandidates.length;

  collatorCandidates.forEach((collator) => {
    calculateApyForSingleCollator(
      collator,
      annualRewardsPerCollator,
      marginalDelegation,
      collatorCommission,
      collatorExpectedBlocksPerRound
    );
  });
};

async function main() {
  const mantaEndpoint = "wss://ws.manta.systems/";
  const api = await createPromiseApi(mantaEndpoint);

  await calculateApyForAllCollators(api);
  await api.disconnect();
}

main().catch(console.error);
