// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { BalanceService } from '@subwallet/extension-base/services/balance-service';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _getAssetDecimals, _getTokenMinAmount, _isChainEvmCompatible, _isNativeToken } from '@subwallet/extension-base/services/chain-service/utils';
import { DEFAULT_SWAP_FIRST_STEP, getSwapAlternativeAsset, MOCK_SWAP_FEE } from '@subwallet/extension-base/services/swap-service/utils';
import { BaseStepDetail } from '@subwallet/extension-base/types/service-base';
import { GenSwapStepFunc, OptimalSwapPath, OptimalSwapPathParams, SwapEarlyValidation, SwapErrorType, SwapFeeInfo, SwapFeeType, SwapProvider, SwapProviderId, SwapQuote, SwapRequest, SwapSubmitParams, SwapSubmitStepData, ValidateSwapProcessParams } from '@subwallet/extension-base/types/swap';
import { formatNumber } from '@subwallet/extension-base/utils';
import BigNumber from 'bignumber.js';
import { t } from 'i18next';

import { isEthereumAddress } from '@polkadot/util-crypto';

export interface SwapBaseInterface {
  getSwapQuote: (request: SwapRequest) => Promise<SwapQuote | SwapError>;
  generateOptimalProcess: (params: OptimalSwapPathParams) => Promise<OptimalSwapPath>;

  getSubmitStep: (params: OptimalSwapPathParams) => Promise<[BaseStepDetail, SwapFeeInfo] | undefined>;

  validateSwapRequest: (request: SwapRequest) => Promise<SwapEarlyValidation>;
  validateSwapProcess: (params: ValidateSwapProcessParams) => Promise<TransactionError[]>;

  handleSwapProcess: (params: SwapSubmitParams) => Promise<SwapSubmitStepData>;
  handleSubmitStep: (params: SwapSubmitParams) => Promise<SwapSubmitStepData>;

  isReady?: boolean;
  init?: () => Promise<void>;
}

export interface SwapBaseHandlerInitParams {
  providerSlug: string,
  providerName: string,
  chainService: ChainService,
  balanceService: BalanceService
}

export class SwapBaseHandler {
  private readonly providerSlug: string;
  private readonly providerName: string;
  public chainService: ChainService;
  public balanceService: BalanceService;

  public constructor ({ balanceService, chainService, providerName, providerSlug }: SwapBaseHandlerInitParams) {
    this.providerName = providerName;
    this.providerSlug = providerSlug;
    this.chainService = chainService;
    this.balanceService = balanceService;
  }

  // public abstract getSwapQuote(request: SwapRequest): Promise<SwapQuote | SwapError>;
  public async generateOptimalProcess (params: OptimalSwapPathParams, genStepFuncList: GenSwapStepFunc[]): Promise<OptimalSwapPath> {
    const result: OptimalSwapPath = {
      totalFee: [MOCK_SWAP_FEE],
      steps: [DEFAULT_SWAP_FIRST_STEP]
    };

    try {
      for (const genStepFunc of genStepFuncList) {
        const step = await genStepFunc.bind(this, params)();

        if (step) {
          result.steps.push({
            id: result.steps.length,
            ...step[0]
          });
          result.totalFee.push(step[1]);
        }
      }

      return result;
    } catch (e) {
      return result;
    }
  }

  public async validateXcmStep (params: ValidateSwapProcessParams, stepIndex: number): Promise<TransactionError[]> {
    const bnAmount = new BigNumber(params.selectedQuote.fromAmount);
    const swapPair = params.selectedQuote.pair;

    const alternativeAssetSlug = getSwapAlternativeAsset(swapPair);

    if (!alternativeAssetSlug) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    const alternativeAsset = this.chainService.getAssetBySlug(alternativeAssetSlug);
    const fromAsset = this.chainService.getAssetBySlug(swapPair.from);

    const [alternativeAssetBalance, fromAssetBalance] = await Promise.all([
      this.balanceService.getTokenFreeBalance(params.address, alternativeAsset.originChain, alternativeAssetSlug),
      this.balanceService.getTokenFreeBalance(params.address, fromAsset.originChain, fromAsset.slug)
    ]);

    const bnAlternativeAssetBalance = new BigNumber(alternativeAssetBalance.value);
    const bnFromAssetBalance = new BigNumber(fromAssetBalance.value);

    const xcmFeeComponent = params.process.totalFee[stepIndex].feeComponent[0]; // todo: can do better than indexing
    const xcmFee = new BigNumber(xcmFeeComponent.amount || '0');
    let xcmAmount = bnAmount.minus(bnFromAssetBalance);

    if (_isNativeToken(alternativeAsset)) {
      xcmAmount = xcmAmount.plus(xcmFee);
    }

    const alternativeTokenMinAmount = new BigNumber(alternativeAsset.minAmount || '0');

    if (!bnAlternativeAssetBalance.minus(xcmAmount).gte(alternativeTokenMinAmount)) {
      const maxBn = bnFromAssetBalance.plus(new BigNumber(alternativeAssetBalance.value)).minus(xcmFee).minus(alternativeTokenMinAmount);
      const maxValue = formatNumber(maxBn.toString(), fromAsset.decimals || 0);

      const altInputTokenInfo = this.chainService.getAssetBySlug(alternativeAssetSlug);
      const symbol = altInputTokenInfo.symbol;

      const alternativeChain = this.chainService.getChainInfoByKey(altInputTokenInfo.originChain);
      const chain = this.chainService.getChainInfoByKey(fromAsset.originChain);

      const inputNetworkName = chain.name;
      const altNetworkName = alternativeChain.name;

      const currentValue = formatNumber(bnFromAssetBalance.toString(), fromAsset.decimals || 0);
      const bnMaxXCM = new BigNumber(alternativeAssetBalance.value).minus(xcmFee).minus(alternativeTokenMinAmount);
      const maxXCMValue = formatNumber(bnMaxXCM.toString(), fromAsset.decimals || 0);

      if (maxBn.lte(0) || bnFromAssetBalance.lte(0) || bnMaxXCM.lte(0)) {
        return [new TransactionError(BasicTxErrorType.NOT_ENOUGH_BALANCE, t(`Insufficient balance. Deposit ${fromAsset.symbol} and try again.`))];
      }

      return [new TransactionError(BasicTxErrorType.NOT_ENOUGH_BALANCE, t(
        'You can only enter a maximum of {{maxValue}} {{symbol}}, which is {{currentValue}} {{symbol}} ({{inputNetworkName}}) and {{maxXCMValue}} {{symbol}} ({{altNetworkName}}). Lower your amount and try again.',
        {
          replace: {
            symbol,
            maxValue,
            inputNetworkName,
            altNetworkName,
            currentValue,
            maxXCMValue
          }
        }
      ))];
    }

    return [];
  }

  public async validateTokenApproveStep (params: ValidateSwapProcessParams, stepIndex: number): Promise<TransactionError[]> {
    return Promise.resolve([]);
  }

  public async validateSetFeeTokenStep (params: ValidateSwapProcessParams, stepIndex: number): Promise<TransactionError[]> {
    if (!params.selectedQuote) {
      return Promise.resolve([new TransactionError(BasicTxErrorType.INTERNAL_ERROR)]);
    }

    const feeInfo = params.process.totalFee[stepIndex];
    const feeAmount = feeInfo.feeComponent[0];
    const feeTokenInfo = this.chainService.getAssetBySlug(feeInfo.defaultFeeToken);

    const feeTokenBalance = await this.balanceService.getTokenFreeBalance(params.address, feeTokenInfo.originChain, feeTokenInfo.slug);
    const bnFeeTokenBalance = new BigNumber(feeTokenBalance.value);
    const bnFeeAmount = new BigNumber(feeAmount.amount);

    if (bnFeeAmount.gte(bnFeeTokenBalance)) {
      return Promise.resolve([new TransactionError(BasicTxErrorType.NOT_ENOUGH_BALANCE)]);
    }

    return [];
  }

  public async validateSwapStep (params: ValidateSwapProcessParams, isXcmOk: boolean, stepIndex: number): Promise<TransactionError[]> {
    if (!params.selectedQuote) {
      return Promise.resolve([new TransactionError(BasicTxErrorType.INTERNAL_ERROR)]);
    }

    const selectedQuote = params.selectedQuote;
    const currentTimestamp = +Date.now();

    if (selectedQuote.aliveUntil <= currentTimestamp) {
      return Promise.resolve([new TransactionError(SwapErrorType.QUOTE_TIMEOUT)]);
    }

    const bnAmount = new BigNumber(params.selectedQuote.fromAmount);
    const fromAsset = this.chainService.getAssetBySlug(params.selectedQuote.pair.from);

    const stepFee = params.process.totalFee[stepIndex].feeComponent;
    const networkFee = stepFee.find((fee) => fee.feeType === SwapFeeType.NETWORK_FEE);

    if (!networkFee) {
      return Promise.resolve([new TransactionError(BasicTxErrorType.INTERNAL_ERROR)]);
    }

    const feeTokenInfo = this.chainService.getAssetBySlug(networkFee.tokenSlug);
    const feeTokenChain = this.chainService.getChainInfoByKey(feeTokenInfo.originChain);

    const [feeTokenBalance, fromAssetBalance] = await Promise.all([
      this.balanceService.getTokenFreeBalance(params.address, feeTokenInfo.originChain, feeTokenInfo.slug),
      this.balanceService.getTokenFreeBalance(params.address, fromAsset.originChain, fromAsset.slug)
    ]);

    const bnFeeTokenBalance = new BigNumber(feeTokenBalance.value);
    const bnFromAssetBalance = new BigNumber(fromAssetBalance.value);
    const bnFeeAmount = new BigNumber(networkFee.amount);

    if (bnFeeTokenBalance.lte(bnFeeAmount)) {
      return Promise.resolve([new TransactionError(BasicTxErrorType.NOT_ENOUGH_BALANCE,
        `You don't have enough ${feeTokenInfo.symbol} (${feeTokenChain.name}) to pay transaction fee`)]);
    }

    if (fromAsset.slug === feeTokenInfo.slug) {
      if (bnFromAssetBalance.lte(bnFeeAmount.plus(bnAmount))) {
        return Promise.resolve([new TransactionError(BasicTxErrorType.NOT_ENOUGH_BALANCE,
          `Insufficient balance. Deposit ${fromAsset.symbol} and try again.`)]);
      }
    }

    if (params.selectedQuote.minSwap) {
      const minProtocolSwap = new BigNumber(params.selectedQuote.minSwap);

      if (!isXcmOk && bnFromAssetBalance.lte(minProtocolSwap)) {
        const parsedMinSwapValue = formatNumber(minProtocolSwap, _getAssetDecimals(fromAsset));

        return Promise.resolve([new TransactionError(SwapErrorType.SWAP_NOT_ENOUGH_BALANCE,
          `Insufficient balance. You need more than ${parsedMinSwapValue} ${fromAsset.symbol} to start swapping. Deposit ${fromAsset.symbol} and try again.`)]); // todo: min swap or amount?
      }
    }

    const bnSrcAssetMinAmount = new BigNumber(_getTokenMinAmount(fromAsset));
    const bnMaxBalanceSwap = bnFromAssetBalance.minus(bnSrcAssetMinAmount);

    if (!isXcmOk && bnAmount.gte(bnMaxBalanceSwap)) {
      const parsedMaxBalanceSwap = formatNumber(bnMaxBalanceSwap, _getAssetDecimals(fromAsset));

      return Promise.resolve([new TransactionError(SwapErrorType.SWAP_EXCEED_ALLOWANCE,
        `Amount too high. Lower your amount ${bnMaxBalanceSwap.gt(0) ? `below ${parsedMaxBalanceSwap} ${fromAsset.symbol}` : ''} and try again`)]);
    }

    if (params.recipient) {
      const toAsset = this.chainService.getAssetBySlug(params.selectedQuote.pair.to);
      const destChainInfo = this.chainService.getChainInfoByKey(toAsset.originChain);

      const isEvmAddress = isEthereumAddress(params.recipient);
      const isEvmDestChain = _isChainEvmCompatible(destChainInfo);

      if ((isEvmAddress && !isEvmDestChain) || (!isEvmAddress && isEvmDestChain)) {
        return Promise.resolve([new TransactionError(SwapErrorType.INVALID_RECIPIENT)]);
      }
    }

    return Promise.resolve([]);
  }

  get name (): string {
    return this.providerName;
  }

  get slug (): string {
    return this.providerSlug;
  }

  get providerInfo (): SwapProvider {
    return {
      id: this.providerSlug as SwapProviderId,
      name: this.providerName
    };
  }
}
