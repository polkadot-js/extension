// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ChainType, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { getERC20Contract, getERC20SpendingApprovalTx } from '@subwallet/extension-base/koni/api/contract-handler/evm/web3';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getAssetDecimals, _getContractAddressOfToken } from '@subwallet/extension-base/services/chain-service/utils';
import { calculateGasFeeParams } from '@subwallet/extension-base/services/fee-service/utils';
import { BaseYieldStepDetail, EarningStatus, HandleYieldStepData, LiquidYieldPoolInfo, OptimalYieldPath, OptimalYieldPathParams, SubmitYieldJoinData, TokenSpendingApprovalParams, TransactionData, UnstakingInfo, UnstakingStatus, YieldPoolMethodInfo, YieldPositionInfo, YieldStepType, YieldTokenBaseInfo } from '@subwallet/extension-base/types';
import { TransactionConfig } from 'web3-core';
import { Contract } from 'web3-eth-contract';

import { BN, BN_TEN, BN_ZERO } from '@polkadot/util';

import { ST_LIQUID_TOKEN_ABI } from '../../constants';
import BaseLiquidStakingPoolHandler from './base';

export const getStellaswapLiquidStakingContract = (networkKey: string, assetAddress: string, evmApi: _EvmApi, options = {}): Contract => {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
  return new evmApi.api.eth.Contract(ST_LIQUID_TOKEN_ABI, assetAddress, options);
};

const APR_STATS_URL = 'https://apr-api.stellaswap.com/api/v1/stdot';

const SUBWALLET_REFERRAL = '0x7e6815f45E624768548d085231f2d453f16FD7DD';

interface StellaswapApr {
  code: number,
  result: number,
  isSuccess: boolean
}

interface StellaswapUnbonding {
  unbonded: string,
  waiting: string
}

export default class StellaSwapLiquidStakingPoolHandler extends BaseLiquidStakingPoolHandler {
  public slug: string;
  protected readonly name: string;
  protected readonly shortName: string;
  protected readonly inputAsset: string = 'moonbeam-LOCAL-xcDOT';
  protected readonly altInputAsset: string = '';
  protected readonly derivativeAssets: string[] = ['moonbeam-ERC20-stDOT-0xbc7E02c4178a7dF7d3E564323a5c359dc96C4db4'];
  protected readonly rewardAssets: string[] = ['moonbeam-LOCAL-xcDOT'];
  protected readonly feeAssets: string[] = ['moonbeam-NATIVE-GLMR'];
  public override transactionChainType: ChainType = ChainType.EVM;
  protected readonly rateDecimals = 10; // Derivative asset decimals
  protected readonly availableMethod: YieldPoolMethodInfo = {
    join: true,
    defaultUnstake: true,
    fastUnstake: false,
    cancelUnstake: false,
    withdraw: true,
    claimReward: false
  };

  constructor (state: KoniState, chain: string) {
    super(state, chain);

    this.slug = 'xcDOT___liquid_staking___stellaswap';
    this.name = 'StellaSwap Liquid Staking';
    this._logo = 'stellaswap';
    this.shortName = 'StellaSwap';
  }

  protected getDescription (): string {
    return 'Earn rewards by staking xcDOT for stDOT';
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

    const rate = equivalentTokenShare as number;
    const exchangeRate = rate / (10 ** _getAssetDecimals(derivativeTokenInfo));

    this.updateExchangeRate(rate);

    return {
      ...this.baseInfo,
      type: this.type,
      metadata: {
        ...this.metadataInfo,
        description: this.getDescription()
      },
      statistic: {
        assetEarning: [
          {
            slug: this.rewardAssets[0],
            apr: (aprObject as StellaswapApr).result,
            exchangeRate: exchangeRate
          }
        ],
        unstakingPeriod: 24 * 28,
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        earningThreshold: {
          join: '0',
          defaultUnstake: '0',
          fastUnstake: '0'
        },
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
          if (cancel) {
            return;
          }

          const rate = await this.getExchangeRate();
          const exchangeRate = new BN(rate);
          const decimals = BN_TEN.pow(new BN(this.rateDecimals));
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
              status: UnstakingStatus.UNLOCKING
            });
          }

          const activeBalance = new BN(balance);
          const acviteToTotal = activeBalance.mul(exchangeRate).div(decimals);
          const totalBalance = acviteToTotal.add(unlockBalance);

          const result: YieldPositionInfo = {
            ...this.baseInfo,
            type: this.type,
            address,
            balanceToken: this.inputAsset,
            totalStake: totalBalance.toString(),
            activeStake: balance.toString(),
            unstakeBalance: unlockBalance.toString(),
            isBondedBefore: totalBalance.gt(BN_ZERO),
            derivativeToken: derivativeTokenSlug,
            status: activeBalance.gt(BN_ZERO) ? EarningStatus.EARNING_REWARD : EarningStatus.NOT_EARNING,
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

    const inputTokenContract = getERC20Contract(_getContractAddressOfToken(inputTokenInfo), evmApi);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const allowanceCall = inputTokenContract.methods.allowance(params.address, _getContractAddressOfToken(derivativeTokenInfo));

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

    if (new BN(params.amount).gt(BN_ZERO)) {
      const stakingContract = getStellaswapLiquidStakingContract(this.chain, _getContractAddressOfToken(derivativeTokenInfo), evmApi);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      const depositCall = stakingContract.methods.deposit(params.amount);

      let estimatedDepositGas = 0;

      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        estimatedDepositGas = (await depositCall.estimateGas({ from: params.address })) as number;
      } catch (e) {
        console.error(e);
      }

      const gasPrice = await evmApi.api.eth.getGasPrice();

      return {
        slug: this.feeAssets[0],
        amount: (estimatedDepositGas * parseInt(gasPrice)).toString()
      };
    } else {
      return {
        slug: this.feeAssets[0],
        amount: '0'
      };
    }
  }

  protected override async validateTokenApproveStep (params: OptimalYieldPathParams, path: OptimalYieldPath): Promise<TransactionError[]> {
    return Promise.resolve([]);
  }

  protected override async handleTokenApproveStep (data: SubmitYieldJoinData, path: OptimalYieldPath): Promise<HandleYieldStepData> {
    const { address } = data;
    const inputTokenSlug = this.inputAsset;
    const inputTokenInfo = this.state.getAssetBySlug(inputTokenSlug);
    const derivativeTokenInfo = this.state.getAssetBySlug(this.derivativeAssets[0]);
    const derivativeTokenContractAddress = _getContractAddressOfToken(derivativeTokenInfo);
    const evmApi = this.evmApi;
    const transactionObject = await getERC20SpendingApprovalTx(derivativeTokenContractAddress, address, _getContractAddressOfToken(inputTokenInfo), evmApi);

    const _data: TokenSpendingApprovalParams = {
      contractAddress: inputTokenSlug,
      spenderAddress: this.derivativeAssets[0],
      owner: address,
      chain: this.chain
    };

    return Promise.resolve({
      txChain: this.chain,
      extrinsicType: ExtrinsicType.TOKEN_SPENDING_APPROVAL,
      extrinsic: transactionObject,
      txData: _data,
      transferNativeAmount: '0',
      chainType: ChainType.EVM
    });
  }

  async handleSubmitStep (data: SubmitYieldJoinData, path: OptimalYieldPath): Promise<HandleYieldStepData> {
    const { address, amount } = data;
    const evmApi = this.evmApi;
    const derivativeTokenSlug = this.derivativeAssets[0];
    const derivativeTokenInfo = this.state.getAssetBySlug(derivativeTokenSlug);
    const stakingContract = getStellaswapLiquidStakingContract(this.chain, _getContractAddressOfToken(derivativeTokenInfo), evmApi);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const depositCall = stakingContract.methods.deposit(amount, SUBWALLET_REFERRAL); // TODO: need test

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const depositEncodedCall = depositCall.encodeABI() as string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const gasLimit = await depositCall.estimateGas({ from: address }) as number;
    const priority = await calculateGasFeeParams(evmApi, this.chain);

    const transactionObject = {
      from: address,
      to: _getContractAddressOfToken(derivativeTokenInfo),
      data: depositEncodedCall,
      gas: gasLimit,
      gasPrice: priority.gasPrice,
      maxFeePerGas: priority.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: priority.maxPriorityFeePerGas?.toString()
    } as TransactionConfig;

    return {
      txChain: this.chain,
      extrinsicType: ExtrinsicType.MINT_STDOT,
      extrinsic: transactionObject,
      txData: data,
      transferNativeAmount: '0',
      chainType: ChainType.EVM
    };
  }

  /* Join pool action */

  /* Leave pool action */

  async handleYieldRedeem (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
  }

  override async handleYieldUnstake (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    const evmApi = this.evmApi;
    const derivativeTokenSlug = this.derivativeAssets[0];
    const derivativeTokenInfo = this.state.getAssetBySlug(derivativeTokenSlug);

    const stakingContract = getStellaswapLiquidStakingContract(this.chain, _getContractAddressOfToken(derivativeTokenInfo), evmApi);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const redeemCall = stakingContract.methods.redeem(amount);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const redeemEncodedCall = redeemCall.encodeABI() as string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const gasLimit = await redeemCall.estimateGas({ from: address }) as number;
    const priority = await calculateGasFeeParams(evmApi, this.chain);

    const transaction: TransactionConfig = {
      from: address,
      to: _getContractAddressOfToken(derivativeTokenInfo),
      data: redeemEncodedCall,
      gas: gasLimit,
      gasPrice: priority.gasPrice,
      maxFeePerGas: priority.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: priority.maxPriorityFeePerGas?.toString()
    };

    return [ExtrinsicType.UNSTAKE_STDOT, transaction];
  }

  /* Leave pool action */

  /* Other actions */

  override async handleYieldWithdraw (address: string, unstakingInfo: UnstakingInfo): Promise<TransactionData> {
    const evmApi = this.evmApi;
    const derivativeTokenSlug = this.derivativeAssets[0];
    const derivativeTokenInfo = this.state.getAssetBySlug(derivativeTokenSlug);

    const stakingContract = getStellaswapLiquidStakingContract(this.chain, _getContractAddressOfToken(derivativeTokenInfo), evmApi);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const withdrawCall = stakingContract.methods.claimUnbonded();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const withdrawEncodedCall = withdrawCall.encodeABI() as string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const gasLimit = await withdrawCall.estimateGas({ from: address }) as number;
    const priority = await calculateGasFeeParams(evmApi, this.chain);

    return {
      from: address,
      to: _getContractAddressOfToken(derivativeTokenInfo),
      data: withdrawEncodedCall,
      gas: gasLimit,
      gasPrice: priority.gasPrice,
      maxFeePerGas: priority.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: priority.maxPriorityFeePerGas?.toString()
    }; // TODO: check tx history parsing
  }

  /* Other actions */
}
