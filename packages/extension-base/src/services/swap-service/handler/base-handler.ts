// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { _validateBalanceToSwap, _validateSwapRecipient } from '@subwallet/extension-base/core/logic-validation/swap';
import { BalanceService } from '@subwallet/extension-base/services/balance-service';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _isNativeToken } from '@subwallet/extension-base/services/chain-service/utils';
import { getSwapAlternativeAsset } from '@subwallet/extension-base/services/swap-service/utils';
import { BaseStepDetail, CommonOptimalPath, CommonStepFeeInfo, DEFAULT_FIRST_STEP, MOCK_STEP_FEE } from '@subwallet/extension-base/types/service-base';
import { GenSwapStepFunc, OptimalSwapPathParams, SwapEarlyValidation, SwapErrorType, SwapFeeType, SwapProvider, SwapProviderId, SwapQuote, SwapRequest, SwapSubmitParams, SwapSubmitStepData, ValidateSwapProcessParams } from '@subwallet/extension-base/types/swap';
import { formatNumber } from '@subwallet/extension-base/utils';
import BigNumber from 'bignumber.js';
import { t } from 'i18next';

export interface SwapBaseInterface {
  providerSlug: SwapProviderId;

  getSwapQuote: (request: SwapRequest) => Promise<SwapQuote | SwapError>;
  generateOptimalProcess: (params: OptimalSwapPathParams) => Promise<CommonOptimalPath>;

  getSubmitStep: (params: OptimalSwapPathParams) => Promise<[BaseStepDetail, CommonStepFeeInfo] | undefined>;

  validateSwapRequest: (request: SwapRequest) => Promise<SwapEarlyValidation>;
  validateSwapProcess: (params: ValidateSwapProcessParams) => Promise<TransactionError[]>;

  handleSwapProcess: (params: SwapSubmitParams) => Promise<SwapSubmitStepData>;
  handleSubmitStep: (params: SwapSubmitParams) => Promise<SwapSubmitStepData>;

  isReady?: boolean;
  init?: () => Promise<void>;
}

export interface SwapBaseHandlerInitParams {
  providerSlug: SwapProviderId,
  providerName: string,
  chainService: ChainService,
  balanceService: BalanceService
}

export class SwapBaseHandler {
  private readonly providerSlug: SwapProviderId;
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
  public async generateOptimalProcess (params: OptimalSwapPathParams, genStepFuncList: GenSwapStepFunc[]): Promise<CommonOptimalPath> {
    const result: CommonOptimalPath = {
      totalFee: [MOCK_STEP_FEE],
      steps: [DEFAULT_FIRST_STEP]
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
      this.balanceService.getTransferableBalance(params.address, alternativeAsset.originChain, alternativeAssetSlug),
      this.balanceService.getTransferableBalance(params.address, fromAsset.originChain, fromAsset.slug)
    ]);

    const bnAlternativeAssetBalance = new BigNumber(alternativeAssetBalance.value);
    const bnFromAssetBalance = new BigNumber(fromAssetBalance.value);

    const xcmFeeComponent = params.process.totalFee[stepIndex].feeComponent[0]; // todo: can do better than indexing
    const xcmFee = new BigNumber(xcmFeeComponent.amount || '0');
    let xcmAmount = bnAmount.minus(bnFromAssetBalance);
    let editedXcmFee = new BigNumber(0);

    if (_isNativeToken(alternativeAsset)) {
      xcmAmount = xcmAmount.plus(xcmFee);
      editedXcmFee = xcmFee.times(2);
    }

    if (!bnAlternativeAssetBalance.minus(_isNativeToken(alternativeAsset) ? xcmAmount.plus(xcmFee) : xcmFee).gt(0)) {
      const maxBn = bnFromAssetBalance.plus(new BigNumber(alternativeAssetBalance.value)).minus(_isNativeToken(alternativeAsset) ? editedXcmFee : xcmFee);
      const maxValue = formatNumber(maxBn.toString(), fromAsset.decimals || 0);

      const altInputTokenInfo = this.chainService.getAssetBySlug(alternativeAssetSlug);
      const symbol = altInputTokenInfo.symbol;

      const alternativeChain = this.chainService.getChainInfoByKey(altInputTokenInfo.originChain);
      const chain = this.chainService.getChainInfoByKey(fromAsset.originChain);

      const inputNetworkName = chain.name;
      const altNetworkName = alternativeChain.name;

      const currentValue = formatNumber(bnFromAssetBalance.toString(), fromAsset.decimals || 0);
      const bnMaxXCM = new BigNumber(alternativeAssetBalance.value).minus(_isNativeToken(alternativeAsset) ? editedXcmFee : xcmFee);
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

    const feeTokenBalance = await this.balanceService.getTransferableBalance(params.address, feeTokenInfo.originChain, feeTokenInfo.slug);
    const bnFeeTokenBalance = new BigNumber(feeTokenBalance.value);
    const bnFeeAmount = new BigNumber(feeAmount.amount);

    if (bnFeeAmount.gte(bnFeeTokenBalance)) {
      return Promise.resolve([new TransactionError(BasicTxErrorType.NOT_ENOUGH_BALANCE)]);
    }

    return [];
  }

  public async validateSwapStep (params: ValidateSwapProcessParams, isXcmOk: boolean, stepIndex: number): Promise<TransactionError[]> {
    // check swap quote timestamp
    // check balance to pay transaction fee
    // check balance against spending amount
    if (!params.selectedQuote) {
      return Promise.resolve([new TransactionError(BasicTxErrorType.INTERNAL_ERROR)]);
    }

    const selectedQuote = params.selectedQuote;
    const currentTimestamp = +Date.now();

    if (selectedQuote.aliveUntil <= currentTimestamp) {
      return Promise.resolve([new TransactionError(SwapErrorType.QUOTE_TIMEOUT)]);
    }

    const stepFee = params.process.totalFee[stepIndex].feeComponent;
    const networkFee = stepFee.find((fee) => fee.feeType === SwapFeeType.NETWORK_FEE);

    if (!networkFee) {
      return Promise.resolve([new TransactionError(BasicTxErrorType.INTERNAL_ERROR)]);
    }

    const fromAsset = this.chainService.getAssetBySlug(params.selectedQuote.pair.from);
    const feeTokenInfo = this.chainService.getAssetBySlug(networkFee.tokenSlug);
    const feeTokenChain = this.chainService.getChainInfoByKey(feeTokenInfo.originChain);

    const { fromAmount, minSwap } = params.selectedQuote;

    const [feeTokenBalance, fromAssetBalance] = await Promise.all([
      this.balanceService.getTransferableBalance(params.address, feeTokenInfo.originChain, feeTokenInfo.slug),
      this.balanceService.getTransferableBalance(params.address, fromAsset.originChain, fromAsset.slug)
    ]);

    const balanceError = _validateBalanceToSwap(fromAsset, feeTokenInfo, feeTokenChain, networkFee.amount, fromAssetBalance.value, feeTokenBalance.value, fromAmount, isXcmOk, minSwap);

    if (balanceError) {
      return Promise.resolve([balanceError]);
    }

    if (!params.recipient) {
      return Promise.resolve([]);
    }

    const toAsset = this.chainService.getAssetBySlug(params.selectedQuote.pair.to);
    const toAssetChain = this.chainService.getChainInfoByKey(toAsset.originChain);

    const recipientError = _validateSwapRecipient(toAssetChain, params.recipient);

    if (recipientError) {
      return Promise.resolve([recipientError]);
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
      id: this.providerSlug,
      name: this.providerName
    };
  }
}
