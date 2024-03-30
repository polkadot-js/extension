// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { PoolService, Swap, TradeRouter } from '@galacticcouncil/sdk';
import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { _AssetType, _ChainAsset } from '@subwallet/chain-list/types';
import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ChainType, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { createXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm';
import { BalanceService } from '@subwallet/extension-base/services/balance-service';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _getAssetDecimals, _getChainNativeTokenSlug, _getTokenMinAmount, _getTokenOnChainAssetId, _isNativeToken } from '@subwallet/extension-base/services/chain-service/utils';
import { SwapBaseHandler, SwapBaseInterface } from '@subwallet/extension-base/services/swap-service/handler/base-handler';
import { calculateSwapRate, getEarlyHydradxValidationError, getSwapAlternativeAsset, SWAP_QUOTE_TIMEOUT_MAP } from '@subwallet/extension-base/services/swap-service/utils';
import { RuntimeDispatchInfo } from '@subwallet/extension-base/types';
import { BaseStepDetail } from '@subwallet/extension-base/types/service-base';
import { HydradxPreValidationMetadata, HydradxSwapTxData, OptimalSwapPath, OptimalSwapPathParams, SwapEarlyValidation, SwapErrorType, SwapFeeComponent, SwapFeeInfo, SwapFeeType, SwapProviderId, SwapQuote, SwapRequest, SwapRoute, SwapStepType, SwapSubmitParams, SwapSubmitStepData, ValidateSwapProcessParams } from '@subwallet/extension-base/types/swap';
import BigNumber from 'bignumber.js';

export class HydradxHandler implements SwapBaseInterface {
  private swapBaseHandler: SwapBaseHandler;
  private tradeRouter: TradeRouter | undefined;
  private readonly isTestnet: boolean;
  public isReady = false;

  constructor (chainService: ChainService, balanceService: BalanceService, isTestnet = true) { // todo: pass in baseHandler from service
    this.swapBaseHandler = new SwapBaseHandler({
      balanceService,
      chainService,
      providerName: isTestnet ? 'HydraDX Testnet' : 'HydraDX',
      providerSlug: isTestnet ? SwapProviderId.HYDRADX_TESTNET : SwapProviderId.HYDRADX_MAINNET
    });

    this.isTestnet = isTestnet;
  }

  public async init (): Promise<void> {
    const chainState = this.chainService.getChainStateByKey(this.chain);

    if (!chainState.active) {
      await this.chainService.enableChain(this.chain);
    }

    const substrateApi = this.chainService.getSubstrateApi(this.chain);

    await substrateApi.api.isReady;
    const poolService = new PoolService(substrateApi.api);

    this.tradeRouter = new TradeRouter(poolService);

    this.isReady = true;
  }

  get chain () { // TODO: check origin chain of tokens in swap pair to determine support
    if (!this.isTestnet) {
      return COMMON_CHAIN_SLUGS.HYDRADX;
    } else {
      return COMMON_CHAIN_SLUGS.HYDRADX_TESTNET;
    }
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

  async getXcmStep (params: OptimalSwapPathParams): Promise<[BaseStepDetail, SwapFeeInfo] | undefined> {
    const bnAmount = new BigNumber(params.request.fromAmount);
    const fromAsset = this.chainService.getAssetBySlug(params.request.pair.from);

    const fromAssetBalance = await this.balanceService.getTokenFreeBalance(params.request.address, fromAsset.originChain, fromAsset.slug);

    const bnFromAssetBalance = new BigNumber(fromAssetBalance.value);

    if (!bnFromAssetBalance.gte(bnAmount)) { // if not enough balance
      const alternativeAssetSlug = getSwapAlternativeAsset(params.request.pair);

      if (alternativeAssetSlug) {
        const alternativeAsset = this.chainService.getAssetBySlug(alternativeAssetSlug);
        const alternativeAssetBalance = await this.balanceService.getTokenFreeBalance(params.request.address, alternativeAsset.originChain, alternativeAsset.slug);
        const bnAlternativeAssetBalance = new BigNumber(alternativeAssetBalance.value);

        if (bnAlternativeAssetBalance.gt(0)) {
          const alternativeChainInfo = this.chainService.getChainInfoByKey(alternativeAsset.originChain);
          const step: BaseStepDetail = {
            metadata: {
              sendingValue: bnAmount.toString(),
              originTokenInfo: alternativeAsset,
              destinationTokenInfo: fromAsset
            },
            name: `Transfer ${alternativeAsset.symbol} from ${alternativeChainInfo.name}`,
            type: SwapStepType.XCM
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

          const fee: SwapFeeInfo = {
            feeComponent: [{
              feeType: SwapFeeType.NETWORK_FEE,
              amount: Math.round(xcmFeeInfo.partialFee * 1.2).toString(),
              tokenSlug: _getChainNativeTokenSlug(alternativeChainInfo)
            }],
            defaultFeeToken: _getChainNativeTokenSlug(alternativeChainInfo),
            feeOptions: [_getChainNativeTokenSlug(alternativeChainInfo)]
          };

          return [step, fee];
        }
      }
    }

    return undefined;
  }

  async getFeeOptionStep (params: OptimalSwapPathParams): Promise<[BaseStepDetail, SwapFeeInfo] | undefined> {
    return Promise.resolve(undefined);
  }

  async getSubmitStep (params: OptimalSwapPathParams): Promise<[BaseStepDetail, SwapFeeInfo] | undefined> {
    if (params.selectedQuote) {
      const submitStep = {
        name: 'Swap',
        type: SwapStepType.SWAP
      };

      return Promise.resolve([submitStep, params.selectedQuote.feeInfo]);
    }

    return Promise.resolve(undefined);
  }

  generateOptimalProcess (params: OptimalSwapPathParams): Promise<OptimalSwapPath> {
    return this.swapBaseHandler.generateOptimalProcess(params, [
      this.getXcmStep,
      this.getFeeOptionStep,
      this.getSubmitStep
    ]);
  }

  private parseSwapPath (swapList: Swap[]): SwapRoute {
    const swapAssets = this.chainService.getAssetByChainAndType(this.chain, [_AssetType.NATIVE, _AssetType.LOCAL]);

    const swapAssetIdMap: Record<string, _ChainAsset> = Object.values(swapAssets).reduce((accumulator, asset) => {
      return {
        ...accumulator,
        [_getTokenOnChainAssetId(asset)]: asset
      };
    }, {});

    const path: string[] = [];

    swapList.forEach((swap) => {
      const swapAssetIn = swapAssetIdMap[swap.assetIn]?.slug;
      const swapAssetOut = swapAssetIdMap[swap.assetOut]?.slug;

      if (swapAssetIn && !path.includes(swapAssetIn)) {
        path.push(swapAssetIn);
      }

      if (swapAssetOut && !path.includes(swapAssetOut)) {
        path.push(swapAssetOut);
      }
    });

    return {
      path
    };
  }

  async getSwapQuote (request: SwapRequest): Promise<SwapQuote | SwapError> {
    const fromAsset = this.chainService.getAssetBySlug(request.pair.from);
    const toAsset = this.chainService.getAssetBySlug(request.pair.to);
    const fromChain = this.chainService.getChainInfoByKey(fromAsset.originChain);
    const fromChainNativeTokenSlug = _getChainNativeTokenSlug(fromChain);

    if (!this.isReady || !this.tradeRouter) {
      return new SwapError(SwapErrorType.UNKNOWN);
    }

    const earlyValidation = await this.validateSwapRequest(request);

    if (earlyValidation.error) {
      const metadata = earlyValidation.metadata as HydradxPreValidationMetadata;

      return getEarlyHydradxValidationError(earlyValidation.error, metadata);
    }

    try {
      const fromAssetId = _getTokenOnChainAssetId(fromAsset);
      const toAssetId = _getTokenOnChainAssetId(toAsset);

      const parsedFromAmount = new BigNumber(request.fromAmount).shiftedBy(-1 * _getAssetDecimals(fromAsset)).toString();
      const quoteResponse = await this.tradeRouter.getBestSell(fromAssetId, toAssetId, parsedFromAmount);

      const toAmount = quoteResponse.amountOut;

      const minReceive = toAmount.times(1 - request.slippage); // todo: multiply with slippage
      const txHex = quoteResponse.toTx(minReceive).hex;

      const substrateApi = this.chainService.getSubstrateApi(this.chain);
      const extrinsic = substrateApi.api.tx(txHex);
      const paymentInfo = await extrinsic.paymentInfo(request.address);

      const networkFee: SwapFeeComponent = {
        tokenSlug: fromChainNativeTokenSlug,
        amount: paymentInfo.partialFee.toString(),
        feeType: SwapFeeType.NETWORK_FEE
      };

      const tradeFee: SwapFeeComponent = {
        tokenSlug: toAsset.slug, // fee is subtracted from receiving amount
        amount: quoteResponse.tradeFee.toString(),
        feeType: SwapFeeType.PLATFORM_FEE
      };

      const swapRoute = this.parseSwapPath(quoteResponse.swaps);

      // todo: check price impact, if price impact > 0.15% -> low liquidity

      return {
        pair: request.pair,
        fromAmount: request.fromAmount,
        toAmount: toAmount.toString(),
        rate: calculateSwapRate(request.fromAmount, toAmount.toString(), fromAsset, toAsset),
        provider: this.providerInfo,
        aliveUntil: +Date.now() + (SWAP_QUOTE_TIMEOUT_MAP[this.slug] || SWAP_QUOTE_TIMEOUT_MAP.default), // todo: ask HydraDX team
        feeInfo: {
          feeComponent: [networkFee, tradeFee],
          defaultFeeToken: fromChainNativeTokenSlug,
          feeOptions: [fromChainNativeTokenSlug] // todo: parse fee options
        },
        route: swapRoute,
        metadata: txHex
      } as SwapQuote;
    } catch (e) {
      console.error('getSwapQuote error', e);

      return new SwapError(SwapErrorType.ERROR_FETCHING_QUOTE);
    }
  }

  public async handleSubmitStep (params: SwapSubmitParams): Promise<SwapSubmitStepData> {
    const txHex = params.quote.metadata as string;
    const fromAsset = this.chainService.getAssetBySlug(params.quote.pair.from);

    const substrateApi = this.chainService.getSubstrateApi(this.chain);

    const chainApi = await substrateApi.isReady;

    const txData: HydradxSwapTxData = {
      provider: this.providerInfo,
      quote: params.quote,
      address: params.address,
      slippage: params.slippage,
      txHex
    };

    const extrinsic = chainApi.api.tx(txHex);

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
      case SwapStepType.DEFAULT:
        return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
      case SwapStepType.XCM:
        return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
      case SwapStepType.SET_FEE_TOKEN:
        return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
      case SwapStepType.SWAP:
        return this.handleSubmitStep(params);
      default:
        return this.handleSubmitStep(params);
    }
  }

  validateSwapProcess (params: ValidateSwapProcessParams): Promise<TransactionError[]> {
    // TODO: validate xcm amount
    return Promise.resolve([]);
  }

  public async validateSwapRequest (request: SwapRequest): Promise<SwapEarlyValidation> {
    const fromAsset = this.chainService.getAssetBySlug(request.pair.from);
    const toAsset = this.chainService.getAssetBySlug(request.pair.to);

    const fromAssetId = _getTokenOnChainAssetId(fromAsset);
    const toAssetId = _getTokenOnChainAssetId(toAsset);

    if (!(fromAsset.originChain === this.chain && toAsset.originChain === this.chain)) {
      return {
        error: SwapErrorType.ASSET_NOT_SUPPORTED
      };
    }

    if (!fromAssetId || !toAssetId) {
      return {
        error: SwapErrorType.UNKNOWN
      };
    }

    try {
      const bnAmount = new BigNumber(request.fromAmount);

      if (bnAmount.lte(0)) {
        return {
          error: SwapErrorType.AMOUNT_CANNOT_BE_ZERO
        };
      }

      return {
        metadata: {
          chain: this.chainService.getChainInfoByKey(this.chain)
        } as HydradxPreValidationMetadata
      };
    } catch (e) {
      return {
        error: SwapErrorType.UNKNOWN
      };
    }
  }
}
