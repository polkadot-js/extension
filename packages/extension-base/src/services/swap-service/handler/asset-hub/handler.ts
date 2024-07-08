// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ChainType, ExtrinsicType, RequestCrossChainTransfer } from '@subwallet/extension-base/background/KoniTypes';
import { _getEarlyAssetHubValidationError, _validateBalanceToSwapOnAssetHub, _validateSwapRecipient } from '@subwallet/extension-base/core/logic-validation/swap';
import { BalanceService } from '@subwallet/extension-base/services/balance-service';
import { createXcmExtrinsic } from '@subwallet/extension-base/services/balance-service/transfer/xcm';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _getChainNativeTokenSlug, _isNativeToken } from '@subwallet/extension-base/services/chain-service/utils';
import { convertSwapRate, getSwapAlternativeAsset, SWAP_QUOTE_TIMEOUT_MAP } from '@subwallet/extension-base/services/swap-service/utils';
import { RuntimeDispatchInfo } from '@subwallet/extension-base/types';
import { BaseStepDetail, CommonFeeComponent, CommonOptimalPath, CommonStepFeeInfo, CommonStepType } from '@subwallet/extension-base/types/service-base';
import { AssetHubSwapEarlyValidation, OptimalSwapPathParams, SwapBaseTxData, SwapErrorType, SwapFeeType, SwapProviderId, SwapQuote, SwapRequest, SwapStepType, SwapSubmitParams, SwapSubmitStepData, ValidateSwapProcessParams } from '@subwallet/extension-base/types/swap';
import BigN from 'bignumber.js';

import { SwapBaseHandler, SwapBaseInterface } from '../base-handler';
import { AssetHubRouter } from './router';

const PAH_LOW_LIQUIDITY_THRESHOLD = 0.15;

export class AssetHubSwapHandler implements SwapBaseInterface {
  private swapBaseHandler: SwapBaseHandler;
  private readonly chain: string;
  private router: AssetHubRouter | undefined;
  isReady = false;
  providerSlug: SwapProviderId;

  constructor (chainService: ChainService, balanceService: BalanceService, chain: string) {
    const chainInfo = chainService.getChainInfoByKey(chain);
    const providerSlug = chain === 'statemint'
      ? SwapProviderId.POLKADOT_ASSET_HUB
      : chain === 'statemine'
        ? SwapProviderId.KUSAMA_ASSET_HUB
        : SwapProviderId.ROCOCO_ASSET_HUB;

    this.swapBaseHandler = new SwapBaseHandler({
      balanceService,
      chainService,
      providerName: chainInfo.name,
      providerSlug
    });

    this.providerSlug = providerSlug;
    this.chain = chain;
  }

  get chainService () {
    return this.swapBaseHandler.chainService;
  }

  get balanceService () {
    return this.swapBaseHandler.balanceService;
  }

  get providerInfo () {
    return this.swapBaseHandler.providerInfo;
  }

  get name () {
    return this.swapBaseHandler.name;
  }

  get slug () {
    return this.swapBaseHandler.slug;
  }

  public async init (): Promise<void> {
    const chainState = this.chainService.getChainStateByKey(this.chain);

    if (!chainState.active) {
      await this.chainService.enableChain(this.chain);
    }

    const substrateApi = this.chainService.getSubstrateApi(this.chain);

    await substrateApi.api.isReady;

    this.router = new AssetHubRouter(this.chain, this.chainService);

    this.isReady = true;
  }

  async getXcmStep (params: OptimalSwapPathParams): Promise<[BaseStepDetail, CommonStepFeeInfo] | undefined> {
    const bnAmount = new BigN(params.request.fromAmount);
    const fromAsset = this.chainService.getAssetBySlug(params.request.pair.from);

    const fromAssetBalance = await this.balanceService.getTransferableBalance(params.request.address, fromAsset.originChain, fromAsset.slug);

    const bnFromAssetBalance = new BigN(fromAssetBalance.value);

    if (bnFromAssetBalance.gte(bnAmount)) {
      return undefined; // enough balance, no need to xcm
    }

    const alternativeAssetSlug = getSwapAlternativeAsset(params.request.pair);

    if (!alternativeAssetSlug) {
      return undefined;
    }

    const alternativeAsset = this.chainService.getAssetBySlug(alternativeAssetSlug);
    const alternativeAssetBalance = await this.balanceService.getTransferableBalance(params.request.address, alternativeAsset.originChain, alternativeAsset.slug);
    const bnAlternativeAssetBalance = new BigN(alternativeAssetBalance.value);

    if (bnAlternativeAssetBalance.lte(0)) {
      return undefined;
    }

    try {
      const alternativeChainInfo = this.chainService.getChainInfoByKey(alternativeAsset.originChain);
      const step: BaseStepDetail = {
        metadata: {
          sendingValue: bnAmount.toString(),
          originTokenInfo: alternativeAsset,
          destinationTokenInfo: fromAsset
        },
        name: `Transfer ${alternativeAsset.symbol} from ${alternativeChainInfo.name}`,
        type: CommonStepType.XCM
      };

      const xcmOriginSubstrateApi = await this.chainService.getSubstrateApi(alternativeAsset.originChain).isReady;

      const xcmTransfer = await createXcmExtrinsic({
        originTokenInfo: alternativeAsset,
        destinationTokenInfo: fromAsset,
        sendingValue: bnAmount.toString(),
        recipient: params.request.address,
        chainInfoMap: this.chainService.getChainInfoMap(),
        substrateApi: xcmOriginSubstrateApi
      });

      const _xcmFeeInfo = await xcmTransfer.paymentInfo(params.request.address);
      const xcmFeeInfo = _xcmFeeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

      const fee: CommonStepFeeInfo = {
        feeComponent: [{
          feeType: SwapFeeType.NETWORK_FEE,
          amount: Math.round(xcmFeeInfo.partialFee * 1.2).toString(),
          tokenSlug: _getChainNativeTokenSlug(alternativeChainInfo)
        }],
        defaultFeeToken: _getChainNativeTokenSlug(alternativeChainInfo),
        feeOptions: [_getChainNativeTokenSlug(alternativeChainInfo)]
      };

      return [step, fee];
    } catch (e) {
      return undefined;
    }
  }

  async getSubmitStep (params: OptimalSwapPathParams): Promise<[BaseStepDetail, CommonStepFeeInfo] | undefined> {
    if (params.selectedQuote) {
      const submitStep = {
        name: 'Swap',
        type: SwapStepType.SWAP
      };

      return Promise.resolve([submitStep, params.selectedQuote.feeInfo]);
    }

    return Promise.resolve(undefined);
  }

  generateOptimalProcess (params: OptimalSwapPathParams): Promise<CommonOptimalPath> {
    return this.swapBaseHandler.generateOptimalProcess(params, [
      this.getXcmStep,
      this.getSubmitStep
    ]);
  }

  async getSwapQuote (request: SwapRequest): Promise<SwapQuote | SwapError> {
    const fromAsset = this.chainService.getAssetBySlug(request.pair.from);
    const toAsset = this.chainService.getAssetBySlug(request.pair.to);
    const fromChain = this.chainService.getChainInfoByKey(fromAsset.originChain);
    const fromChainNativeTokenSlug = _getChainNativeTokenSlug(fromChain);

    if (!this.isReady || !this.router) {
      return new SwapError(SwapErrorType.UNKNOWN);
    }

    const earlyValidation = await this.validateSwapRequest(request);

    if (earlyValidation.error) {
      const metadata = earlyValidation.metadata;

      return _getEarlyAssetHubValidationError(earlyValidation.error, metadata);
    }

    try {
      const paths = this.router.buildPath(request.pair);
      const amountOut = earlyValidation.metadata.toAmount;
      const toAmount = new BigN(amountOut);
      const minReceive = toAmount.times(1 - request.slippage).integerValue(BigN.ROUND_DOWN);
      const extrinsic = await this.router.buildSwapExtrinsic(paths, request.address, request.fromAmount, minReceive.toString());
      const paymentInfo = await extrinsic.paymentInfo(request.address);

      const networkFee: CommonFeeComponent = {
        tokenSlug: fromChainNativeTokenSlug,
        amount: paymentInfo.partialFee.toString(),
        feeType: SwapFeeType.NETWORK_FEE
      };

      const feeTokenOptions = [fromChainNativeTokenSlug];
      const selectedFeeToken = fromChainNativeTokenSlug;
      const priceImpactPct = earlyValidation.metadata.priceImpactPct || '0';

      return {
        pair: request.pair,
        fromAmount: request.fromAmount,
        toAmount: toAmount.toString(),
        rate: convertSwapRate(earlyValidation.metadata.quoteRate, fromAsset, toAsset),
        provider: this.providerInfo,
        aliveUntil: +Date.now() + (SWAP_QUOTE_TIMEOUT_MAP[this.slug] || SWAP_QUOTE_TIMEOUT_MAP.default),
        feeInfo: {
          feeComponent: [networkFee],
          defaultFeeToken: fromChainNativeTokenSlug,
          feeOptions: feeTokenOptions, // TODO: enable fee options
          selectedFeeToken
        },
        isLowLiquidity: Math.abs(parseFloat(priceImpactPct)) >= PAH_LOW_LIQUIDITY_THRESHOLD,
        route: {
          path: paths.map((asset) => asset.slug)
        }
      } as SwapQuote;
    } catch (e) {
      return new SwapError(SwapErrorType.ERROR_FETCHING_QUOTE);
    }
  }

  public async handleXcmStep (params: SwapSubmitParams): Promise<SwapSubmitStepData> {
    const pair = params.quote.pair;
    const alternativeAssetSlug = getSwapAlternativeAsset(pair) as string;

    const originAsset = this.chainService.getAssetBySlug(alternativeAssetSlug);
    const destinationAsset = this.chainService.getAssetBySlug(pair.from);

    const substrateApi = this.chainService.getSubstrateApi(originAsset.originChain);

    const chainApi = await substrateApi.isReady;

    const destinationAssetBalance = await this.balanceService.getTransferableBalance(params.address, destinationAsset.originChain, destinationAsset.slug);
    const xcmFee = params.process.totalFee[params.currentStep];

    const bnAmount = new BigN(params.quote.fromAmount);
    const bnDestinationAssetBalance = new BigN(destinationAssetBalance.value);

    let bnTotalAmount = bnAmount.minus(bnDestinationAssetBalance);

    if (_isNativeToken(originAsset)) {
      const bnXcmFee = new BigN(xcmFee.feeComponent[0].amount); // xcm fee is paid in native token but swap token is not always native token

      bnTotalAmount = bnTotalAmount.plus(bnXcmFee);
    }

    const xcmTransfer = await createXcmExtrinsic({
      originTokenInfo: originAsset,
      destinationTokenInfo: destinationAsset,
      sendingValue: bnTotalAmount.toString(),
      recipient: params.address,
      chainInfoMap: this.chainService.getChainInfoMap(),
      substrateApi: chainApi
    });

    const xcmData: RequestCrossChainTransfer = {
      originNetworkKey: originAsset.originChain,
      destinationNetworkKey: destinationAsset.originChain,
      from: params.address,
      to: params.address,
      value: bnTotalAmount.toString(),
      tokenSlug: originAsset.slug,
      showExtraWarning: true
    };

    return {
      txChain: originAsset.originChain,
      extrinsic: xcmTransfer,
      transferNativeAmount: _isNativeToken(originAsset) ? bnTotalAmount.toString() : '0',
      extrinsicType: ExtrinsicType.TRANSFER_XCM,
      chainType: ChainType.SUBSTRATE,
      txData: xcmData
    } as SwapSubmitStepData;
  }

  async handleSubmitStep (params: SwapSubmitParams): Promise<SwapSubmitStepData> {
    const fromAsset = this.chainService.getAssetBySlug(params.quote.pair.from);

    const txData: SwapBaseTxData = {
      provider: this.providerInfo,
      quote: params.quote,
      address: params.address,
      slippage: params.slippage,
      process: params.process
    };

    const paths = params.quote.route.path.map((slug) => this.chainService.getAssetBySlug(slug));
    const { fromAmount, toAmount } = params.quote;

    const minReceive = new BigN(1 - params.slippage).times(toAmount).integerValue(BigN.ROUND_DOWN);

    const extrinsic = await this.router?.buildSwapExtrinsic(paths, params.address, fromAmount, minReceive.toString());

    return {
      txChain: fromAsset.originChain,
      txData,
      extrinsic,
      transferNativeAmount: _isNativeToken(fromAsset) ? params.quote.fromAmount : '0', // todo
      extrinsicType: ExtrinsicType.SWAP,
      chainType: ChainType.SUBSTRATE
    } as SwapSubmitStepData;
  }

  handleSwapProcess (params: SwapSubmitParams): Promise<SwapSubmitStepData> {
    const { currentStep, process } = params;
    const type = process.steps[currentStep].type;

    switch (type) {
      case CommonStepType.XCM:
        return this.handleXcmStep(params);
      case SwapStepType.SWAP:
        return this.handleSubmitStep(params);
      default:
        return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
    }
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

    const balanceError = _validateBalanceToSwapOnAssetHub(fromAsset, feeTokenInfo, feeTokenChain, networkFee.amount, fromAssetBalance.value, feeTokenBalance.value, fromAmount, isXcmOk, minSwap);

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

  async validateSwapProcess (params: ValidateSwapProcessParams): Promise<TransactionError[]> {
    const amount = params.selectedQuote.fromAmount;
    const bnAmount = new BigN(amount);

    if (bnAmount.lte(0)) {
      return [new TransactionError(BasicTxErrorType.INVALID_PARAMS, 'Amount must be greater than 0')];
    }

    let isXcmOk = false;

    for (const [index, step] of params.process.steps.entries()) {
      const getErrors = async (): Promise<TransactionError[]> => {
        switch (step.type) {
          case CommonStepType.DEFAULT:
            return Promise.resolve([]);
          case CommonStepType.XCM:
            return this.swapBaseHandler.validateXcmStep(params, index);
          case SwapStepType.SWAP:
            return this.validateSwapStep(params, isXcmOk, index);
          default:
            return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
        }
      };

      const errors = await getErrors();

      if (errors.length) {
        return errors;
      } else if (step.type === CommonStepType.XCM) {
        isXcmOk = true;
      }
    }

    return [];
  }

  validateSwapRequest (request: SwapRequest): Promise<AssetHubSwapEarlyValidation> {
    if (!this.isReady || !this.router) {
      throw new SwapError(SwapErrorType.ERROR_FETCHING_QUOTE);
    }

    return this.router.earlyValidateSwapValidation(request);
  }
}
