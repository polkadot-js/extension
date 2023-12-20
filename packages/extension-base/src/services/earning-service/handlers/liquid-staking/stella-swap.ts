// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { getERC20Contract } from '@subwallet/extension-base/koni/api/tokens/evm/web3';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getAssetDecimals, _getContractAddressOfToken } from '@subwallet/extension-base/services/chain-service/utils';
import { BaseYieldStepDetail, EarningStatus, HandleYieldStepData, LiquidYieldPoolInfo, OptimalYieldPath, OptimalYieldPathParams, SubmitYieldJoinData, TransactionData, UnstakingInfo, UnstakingStatus, YieldPoolGroup, YieldPositionInfo, YieldStepType, YieldTokenBaseInfo } from '@subwallet/extension-base/types';
import { BN } from 'bn.js';
import fetch from 'cross-fetch';
import { TransactionConfig } from 'web3-core';
import { Contract } from 'web3-eth-contract';

import { BN_ZERO } from '@polkadot/util';

import { DEFAULT_YIELD_FIRST_STEP, ST_LIQUID_TOKEN_ABI } from '../../constants';
import BaseLiquidStakingPoolHandler from './base';

export const getStellaswapLiquidStakingContract = (networkKey: string, assetAddress: string, evmApi: _EvmApi, options = {}): Contract => {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
  return new evmApi.api.eth.Contract(ST_LIQUID_TOKEN_ABI, assetAddress, options);
};

const APR_STATS_URL = 'https://apr-api.stellaswap.com/api/v1/stdot';

interface StellaswapApr {
  code: number,
  result: number,
  isSuccess: boolean
}

interface StellaswapUnbonding {
  unbonded: string,
  waiting: string
}

const MAX_INT = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

export default class StellaSwapLiquidStakingPoolHandler extends BaseLiquidStakingPoolHandler {
  protected readonly description: string;
  protected readonly group: YieldPoolGroup;
  protected readonly name: string;
  protected readonly logo: string;
  protected readonly inputAsset: string = 'moonbeam-LOCAL-xcDOT';
  protected readonly altInputAsset: string = '';
  protected readonly derivativeAssets: string[] = ['moonbeam-ERC20-stDOT-0xbc7E02c4178a7dF7d3E564323a5c359dc96C4db4'];
  protected readonly rewardAssets: string[] = ['moonbeam-LOCAL-xcDOT'];
  protected readonly feeAssets: string[] = ['moonbeam-NATIVE-GLMR'];
  /** @inner */
  protected override readonly allowDefaultUnstake = true;
  /** @inner */
  protected override readonly allowFastUnstake = false;
  public slug: string;

  constructor (state: KoniState, chain: string) {
    super(state, chain);

    this.slug = 'xcDOT___liquid_staking___stellaswap';
    this.name = 'Stellaswap Liquid Staking';
    this.description = 'Earn rewards by staking xcDOT for stDOT';
    this.group = YieldPoolGroup.DOT;
    this.logo = 'stellaswap';
  }

  /* Subscribe pool info */

  async getPoolStat (): Promise<LiquidYieldPoolInfo> {
    const evmApi = this.evmApi;
    const derivativeTokenSlug = this.derivativeAssets[0];
    const derivativeTokenInfo = this.state.getAssetBySlug(derivativeTokenSlug);
    const stakingContract = getStellaswapLiquidStakingContract(this.chain, _getContractAddressOfToken(derivativeTokenInfo), evmApi);

    const aprPromise = new Promise(function (resolve) {
      fetch(APR_STATS_URL, {
        method: 'GET'
      }).then((res) => {
        resolve(res.json());
      }).catch(console.error);
    });

    const sampleTokenShare = 10 ** _getAssetDecimals(derivativeTokenInfo);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const tvlCall = stakingContract.methods.fundRaisedBalance();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const exchangeRateCall = stakingContract.methods.getPooledTokenByShares(sampleTokenShare);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [aprObject, tvl, equivalentTokenShare] = await Promise.all([
      aprPromise,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      tvlCall.call(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      exchangeRateCall.call()
    ]);

    const exchangeRate = (equivalentTokenShare as number) / (10 ** _getAssetDecimals(derivativeTokenInfo));

    return {
      ...this.defaultInfo,
      description: this.description,
      type: this.type,
      metadata: {
        ...this.baseMetadata,
        isAvailable: true,
        allowCancelUnstaking: false,
        assetEarning: [
          {
            slug: this.rewardAssets[0],
            apr: (aprObject as StellaswapApr).result,
            exchangeRate: exchangeRate
          }
        ],
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        minJoinPool: '0',
        minWithdrawal: '0',
        totalApr: (aprObject as StellaswapApr).result,
        tvl: (tvl as number).toString()
      }
    };
  }

  /* Subscribe pool info */

  /* Subscribe pool position */

  // eslint-disable-next-line @typescript-eslint/require-await
  async subscribePoolPosition (useAddresses: string[], resultCallback: (rs: YieldPositionInfo) => void): Promise<VoidFunction> {
    let cancel = false;
    const evmApi = this.evmApi;
    const derivativeTokenSlug = this.derivativeAssets?.[0] || '';
    const derivativeTokenInfo = this.state.getAssetBySlug(derivativeTokenSlug);
    const contract = getStellaswapLiquidStakingContract(this.chain, _getContractAddressOfToken(derivativeTokenInfo), evmApi);

    const getTokenBalance = () => {
      if (!cancel) {
        useAddresses.map(async (address) => {
          if (!cancel) {
            return;
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          const balance = (await contract.methods.balanceOf(address).call()) as string;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          const unbondedObject = (await contract.methods.getUnbonded(address).call()) as StellaswapUnbonding;
          const unstakings: UnstakingInfo[] = [];
          let unlockBalance = BN_ZERO;

          if (parseInt(unbondedObject.unbonded) > 0) {
            unlockBalance = unlockBalance.add(new BN(unbondedObject.unbonded));
            unstakings.push({
              chain: this.chain,
              claimable: unbondedObject.unbonded,
              status: UnstakingStatus.CLAIMABLE,
              waitingTime: 0
            });
          }

          if (parseInt(unbondedObject.waiting) > 0) {
            unlockBalance = unlockBalance.add(new BN(unbondedObject.waiting));
            unstakings.push({
              chain: this.chain,
              claimable: unbondedObject.waiting,
              status: UnstakingStatus.UNLOCKING,
              waitingTime: 20 // TODO: Recheck
            });
          }

          const totalBalance = new BN(balance).add(unlockBalance);

          const result: YieldPositionInfo = {
            ...this.defaultInfo,
            type: this.type,
            address,
            totalStake: totalBalance.toString(),
            activeStake: balance.toString(),
            unstakeBalance: unlockBalance.toString(),
            isBondedBefore: totalBalance.gt(BN_ZERO),
            derivativeToken: derivativeTokenSlug,
            status: EarningStatus.EARNING_REWARD,
            nominations: [],
            unstakings
          };

          resultCallback(result);
        });
      }
    };

    getTokenBalance();

    const interval = setInterval(getTokenBalance, 30000);

    return () => {
      cancel = true;
      clearInterval(interval);
    };
  }

  /* Subscribe pool position */

  /* Join pool action */

  get submitJoinStepInfo (): BaseYieldStepDetail {
    return {
      name: 'Mint stDOT',
      type: YieldStepType.MINT_STDOT
    };
  }

  override async getTokenApproveStep (params: OptimalYieldPathParams): Promise<[BaseYieldStepDetail, YieldTokenBaseInfo] | undefined> {
    const evmApi = this.evmApi;

    const derivativeTokenSlug = this.derivativeAssets[0];
    const derivativeTokenInfo = this.state.getAssetBySlug(derivativeTokenSlug);
    const inputTokenSlug = this.inputAsset;
    const inputTokenInfo = this.state.getAssetBySlug(inputTokenSlug);

    const inputTokenContract = getERC20Contract(this.chain, _getContractAddressOfToken(inputTokenInfo), this.state.getEvmApiMap());
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const allowanceCall = inputTokenContract.methods.allowance(params.address, _getContractAddressOfToken(derivativeTokenInfo)); // TODO

    const [allowance, gasPrice] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      (await allowanceCall.call()) as string,
      evmApi.api.eth.getGasPrice()
    ]);

    if (!allowance || parseInt(allowance) <= 0) {
      const step: BaseYieldStepDetail = {
        name: 'Authorize token approval',
        type: YieldStepType.TOKEN_APPROVAL
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const estimatedGas = (await allowanceCall.estimateGas()) as number;

      const fee: YieldTokenBaseInfo = {
        slug: this.feeAssets[0],
        amount: (estimatedGas * parseInt(gasPrice)).toString()
      };

      return [step, fee];
    }

    return undefined;
  }

  async getSubmitStepFee (params: OptimalYieldPathParams): Promise<YieldTokenBaseInfo> {
    const evmApi = this.evmApi;

    const derivativeTokenSlug = this.derivativeAssets[0];
    const derivativeTokenInfo = this.state.getAssetBySlug(derivativeTokenSlug);

    const stakingContract = getStellaswapLiquidStakingContract(this.chain, _getContractAddressOfToken(derivativeTokenInfo), evmApi);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const depositCall = stakingContract.methods.deposit(params.amount);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const estimatedDepositGas = (await depositCall.estimateGas()) as number;
    const gasPrice = await evmApi.api.eth.getGasPrice();

    return {
      slug: this.feeAssets[0],
      amount: (estimatedDepositGas * parseInt(gasPrice)).toString()
    };
  }

  override async generateOptimalPath (params: OptimalYieldPathParams): Promise<OptimalYieldPath> {
    const result: OptimalYieldPath = {
      totalFee: [{ slug: '' }],
      steps: [DEFAULT_YIELD_FIRST_STEP]
    };

    try {
      /* Token approve step */

      const approveStep = await this.getTokenApproveStep(params);

      if (approveStep) {
        const [step, fee] = approveStep;

        result.steps.push({
          id: result.steps.length,
          ...step
        });

        result.totalFee.push(fee);
      }

      /* Token approve step */

      /* Submit step */

      const submitFee = await this.getSubmitStepFee(params);

      result.steps.push({
        id: result.steps.length,
        ...this.submitJoinStepInfo
      });

      result.totalFee.push(submitFee);

      /* Submit step */

      return result;
    } catch (e) {
      const errorMessage = (e as Error).message;

      if (errorMessage.includes('network')) {
        result.connectionError = errorMessage.split(' ')[0];
      }

      /* Submit step */

      result.steps.push({
        id: result.steps.length,
        ...this.submitJoinStepInfo
      });

      result.totalFee.push({
        slug: this.feeAssets[0],
        amount: '0'
      });

      /* Submit step */

      return result;
    }
  }

  protected override async validateTokenApproveStep (params: OptimalYieldPathParams, path: OptimalYieldPath): Promise<TransactionError[]> {
    return Promise.resolve([]);
  }

  protected override async handleTokenApproveStep (data: SubmitYieldJoinData, path: OptimalYieldPath): Promise<HandleYieldStepData> {
    const { address } = data;
    const inputTokenSlug = this.inputAsset;
    const inputTokenInfo = this.state.getAssetBySlug(inputTokenSlug);

    const inputTokenContract = getERC20Contract(this.chain, _getContractAddressOfToken(inputTokenInfo), this.state.getEvmApiMap());

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const approveCall = inputTokenContract.methods.approve(address, MAX_INT);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const approveEncodedCall = approveCall.encodeABI() as string;

    const transactionObject = {
      from: address,
      to: _getContractAddressOfToken(inputTokenInfo),
      data: approveEncodedCall
    } as TransactionConfig;

    return Promise.resolve({
      txChain: this.chain,
      extrinsicType: ExtrinsicType.EVM_EXECUTE,
      extrinsic: transactionObject,
      txData: transactionObject,
      transferNativeAmount: '0'
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async handleSubmitStep (data: SubmitYieldJoinData, path: OptimalYieldPath): Promise<HandleYieldStepData> {
    const { address, amount } = data;
    const evmApi = this.evmApi;
    const derivativeTokenSlug = this.derivativeAssets[0];
    const derivativeTokenInfo = this.state.getAssetBySlug(derivativeTokenSlug);
    const stakingContract = getStellaswapLiquidStakingContract(this.chain, _getContractAddressOfToken(derivativeTokenInfo), evmApi);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const depositCall = stakingContract.methods.deposit(amount); // TODO: referral

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const depositEncodedCall = depositCall.encodeABI() as string;

    const transactionObject = {
      from: address,
      to: _getContractAddressOfToken(derivativeTokenInfo),
      data: depositEncodedCall
    } as TransactionConfig;

    return {
      txChain: this.chain,
      extrinsicType: ExtrinsicType.MINT_STDOT,
      extrinsic: transactionObject,
      txData: data,
      transferNativeAmount: '0'
    };
  }

  /* Join pool action */

  /* Leave pool action */

  async handleYieldRedeem (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  override async handleYieldUnstake (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    const evmApi = this.evmApi;
    const derivativeTokenSlug = this.derivativeAssets[0];
    const derivativeTokenInfo = this.state.getAssetBySlug(derivativeTokenSlug);

    const stakingContract = getStellaswapLiquidStakingContract(this.chain, _getContractAddressOfToken(derivativeTokenInfo), evmApi);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const redeemCall = stakingContract.methods.redeem(amount);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const redeemEncodedCall = redeemCall.encodeABI() as string;

    const transaction: TransactionConfig = {
      from: address,
      to: _getContractAddressOfToken(derivativeTokenInfo),
      data: redeemEncodedCall
    };

    return [ExtrinsicType.STAKING_UNBOND, transaction];
  }

  /* Leave pool action */
}
