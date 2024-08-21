// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { PoolError, PoolService, Swap, TradeRouter } from '@galacticcouncil/sdk';
import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { _AssetType, _ChainAsset } from '@subwallet/chain-list/types';
import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ChainType, ExtrinsicType, RequestChangeFeeToken, RequestCrossChainTransfer } from '@subwallet/extension-base/background/KoniTypes';
import { _getEarlyHydradxValidationError } from '@subwallet/extension-base/core/logic-validation/swap';
import { BalanceService } from '@subwallet/extension-base/services/balance-service';
import { createXcmExtrinsic } from '@subwallet/extension-base/services/balance-service/transfer/xcm';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _getAssetDecimals, _getChainNativeTokenSlug, _getTokenOnChainAssetId, _isNativeToken } from '@subwallet/extension-base/services/chain-service/utils';
import { SwapBaseHandler, SwapBaseInterface } from '@subwallet/extension-base/services/swap-service/handler/base-handler';
import { calculateSwapRate, getSwapAlternativeAsset, SWAP_QUOTE_TIMEOUT_MAP } from '@subwallet/extension-base/services/swap-service/utils';
import { RuntimeDispatchInfo } from '@subwallet/extension-base/types';
import { BaseStepDetail, CommonFeeComponent, CommonOptimalPath, CommonStepFeeInfo, CommonStepType } from '@subwallet/extension-base/types/service-base';
import { HydradxPreValidationMetadata, HydradxSwapTxData, OptimalSwapPathParams, SwapEarlyValidation, SwapErrorType, SwapFeeType, SwapProviderId, SwapQuote, SwapRequest, SwapRoute, SwapStepType, SwapSubmitParams, SwapSubmitStepData, ValidateSwapProcessParams } from '@subwallet/extension-base/types/swap';
import BigNumber from 'bignumber.js';

import { SubmittableExtrinsic } from '@polkadot/api/types';

const HYDRADX_LOW_LIQUIDITY_THRESHOLD = 0.15;

const HYDRADX_SUBWALLET_REFERRAL_CODE = 'WALLET';
const HYDRADX_SUBWALLET_REFERRAL_ACCOUNT = '7PCsCpkgsHdNaZhv79wCCQ5z97uxVbSeSCtDMUa1eZHKXy4a';

const HYDRADX_TESTNET_SUBWALLET_REFERRAL_CODE = 'ASSETHUB';
const HYDRADX_TESTNET_SUBWALLET_REFERRAL_ACCOUNT = '7LCt6dFqtxzdKVB2648jWW9d85doiFfLSbZJDNAMVJNxh5rJ';

export class HydradxHandler implements SwapBaseInterface {
  private swapBaseHandler: SwapBaseHandler;
  private tradeRouter: TradeRouter | undefined;
  private readonly isTestnet: boolean = true;
  public isReady = false;
  providerSlug: SwapProviderId;

  constructor (chainService: ChainService, balanceService: BalanceService, isTestnet = true) {
    this.swapBaseHandler = new SwapBaseHandler({
      balanceService,
      chainService,
      providerName: isTestnet ? 'Hydration Testnet' : 'Hydration',
      providerSlug: isTestnet ? SwapProviderId.HYDRADX_TESTNET : SwapProviderId.HYDRADX_MAINNET
    });
    this.providerSlug = isTestnet ? SwapProviderId.HYDRADX_TESTNET : SwapProviderId.HYDRADX_MAINNET;

    this.isTestnet = isTestnet;
  }

  public async init (): Promise<void> {
    const chainState = this.chainService.getChainStateByKey(this.chain());

    if (!chainState.active) {
      await this.chainService.enableChain(this.chain());
    }

    const substrateApi = this.chainService.getSubstrateApi(this.chain());

    await substrateApi.api.isReady;
    const poolService = new PoolService(substrateApi.api);

    this.tradeRouter = new TradeRouter(poolService);

    this.isReady = true;
  }

  chain = (): string => { // TODO: check origin chain of tokens in swap pair to determine support
    if (!this.isTestnet) {
      return COMMON_CHAIN_SLUGS.HYDRADX;
    } else {
      return COMMON_CHAIN_SLUGS.HYDRADX_TESTNET;
    }
  };

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

  async getXcmStep (params: OptimalSwapPathParams): Promise<[BaseStepDetail, CommonStepFeeInfo] | undefined> {
    const bnAmount = new BigNumber(params.request.fromAmount);
    const fromAsset = this.chainService.getAssetBySlug(params.request.pair.from);

    const fromAssetBalance = await this.balanceService.getTransferableBalance(params.request.address, fromAsset.originChain, fromAsset.slug);

    const bnFromAssetBalance = new BigNumber(fromAssetBalance.value);

    if (bnFromAssetBalance.gte(bnAmount)) {
      return undefined; // enough balance, no need to xcm
    }

    const alternativeAssetSlug = getSwapAlternativeAsset(params.request.pair);

    if (!alternativeAssetSlug) {
      return undefined;
    }

    const alternativeAsset = this.chainService.getAssetBySlug(alternativeAssetSlug);
    const alternativeAssetBalance = await this.balanceService.getTransferableBalance(params.request.address, alternativeAsset.originChain, alternativeAsset.slug);
    const bnAlternativeAssetBalance = new BigNumber(alternativeAssetBalance.value);

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

  async getFeeOptionStep (params: OptimalSwapPathParams): Promise<[BaseStepDetail, CommonStepFeeInfo] | undefined> {
    if (!params.selectedQuote) {
      return Promise.resolve(undefined);
    }

    const selectedFeeToken = params.selectedQuote.feeInfo.selectedFeeToken;

    if (!selectedFeeToken) {
      return undefined;
    }

    const feeStep: BaseStepDetail = {
      name: 'Set fee token',
      type: CommonStepType.SET_FEE_TOKEN
    };

    try {
      const substrateApi = this.chainService.getSubstrateApi(this.chain());
      const chainApi = await substrateApi.isReady;

      const _currentFeeAssetId = await chainApi.api.query.multiTransactionPayment.accountCurrencyMap(params.request.address);
      const currentFeeAssetId = _currentFeeAssetId.toString();

      const selectedFeeAsset = this.chainService.getAssetBySlug(selectedFeeToken);
      const assetId = _getTokenOnChainAssetId(selectedFeeAsset);

      if (currentFeeAssetId === assetId) {
        return;
      }

      const setFeeTx = chainApi.api.tx.multiTransactionPayment.setCurrency(assetId);
      const _txFee = await setFeeTx.paymentInfo(params.request.address);
      const txFee = _txFee.toPrimitive() as unknown as RuntimeDispatchInfo;

      const fee: CommonStepFeeInfo = {
        feeComponent: [{
          feeType: SwapFeeType.NETWORK_FEE,
          amount: Math.round(txFee.partialFee).toString(),
          tokenSlug: selectedFeeAsset.slug
        }],
        selectedFeeToken: selectedFeeAsset.slug,
        defaultFeeToken: selectedFeeAsset.slug,
        feeOptions: [selectedFeeAsset.slug]
      };

      return [
        feeStep,
        fee
      ];
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
      // this.getFeeOptionStep.bind(this),
      this.getSubmitStep
    ]);
  }

  private getSwapPathErrors (swapList: Swap[]): PoolError[] {
    return swapList.reduce((prev, current) => {
      return [
        ...prev,
        ...current.errors
      ];
    }, [] as PoolError[]);
  }

  private parseSwapPath (swapList: Swap[]): SwapRoute {
    const swapAssets = this.chainService.getAssetByChainAndType(this.chain(), [_AssetType.NATIVE, _AssetType.LOCAL]);

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

      return _getEarlyHydradxValidationError(earlyValidation.error, metadata);
    }

    try {
      const fromAssetId = _getTokenOnChainAssetId(fromAsset);
      const toAssetId = _getTokenOnChainAssetId(toAsset);

      const parsedFromAmount = new BigNumber(request.fromAmount).shiftedBy(-1 * _getAssetDecimals(fromAsset)).toString();
      const quoteResponse = await this.tradeRouter.getBestSell(fromAssetId, toAssetId, parsedFromAmount);

      const toAmount = quoteResponse.amountOut;

      const minReceive = toAmount.times(1 - request.slippage).integerValue();
      const txHex = quoteResponse.toTx(minReceive).hex;

      const substrateApi = this.chainService.getSubstrateApi(this.chain());
      const extrinsic = substrateApi.api.tx(txHex);
      const paymentInfo = await extrinsic.paymentInfo(request.address);

      const networkFee: CommonFeeComponent = {
        tokenSlug: fromChainNativeTokenSlug,
        amount: paymentInfo.partialFee.toString(),
        feeType: SwapFeeType.NETWORK_FEE
      };

      const tradeFee: CommonFeeComponent = {
        tokenSlug: toAsset.slug, // fee is subtracted from receiving amount
        amount: quoteResponse.tradeFee.toString(),
        feeType: SwapFeeType.PLATFORM_FEE
      };

      const swapRoute = this.parseSwapPath(quoteResponse.swaps);
      const swapPathErrors = this.getSwapPathErrors(quoteResponse.swaps);

      if (swapPathErrors.length > 0) {
        const defaultError = swapPathErrors[0]; // might parse more errors

        switch (defaultError) {
          case PoolError.InsufficientTradingAmount:
            return new SwapError(SwapErrorType.SWAP_NOT_ENOUGH_BALANCE);
          case PoolError.TradeNotAllowed:
            return new SwapError(SwapErrorType.ERROR_FETCHING_QUOTE);
          case PoolError.MaxInRatioExceeded:
            return new SwapError(SwapErrorType.NOT_ENOUGH_LIQUIDITY);
          case PoolError.UnknownError:
            return new SwapError(SwapErrorType.ERROR_FETCHING_QUOTE);
          case PoolError.MaxOutRatioExceeded:
            return new SwapError(SwapErrorType.NOT_ENOUGH_LIQUIDITY);
        }
      }

      // const feeTokenOptions = this.chainService.getFeeTokensByChain(this.chain());
      const feeTokenOptions = [fromChainNativeTokenSlug];

      // if (request.feeToken && !feeTokenOptions.includes(request.feeToken)) {
      //   return new SwapError(SwapErrorType.UNKNOWN);
      // }

      // const selectedFeeToken = request.feeToken || fromChainNativeTokenSlug;
      const selectedFeeToken = fromChainNativeTokenSlug;

      return {
        pair: request.pair,
        fromAmount: request.fromAmount,
        toAmount: toAmount.toString(),
        rate: calculateSwapRate(request.fromAmount, toAmount.toString(), fromAsset, toAsset),
        provider: this.providerInfo,
        aliveUntil: +Date.now() + (SWAP_QUOTE_TIMEOUT_MAP[this.slug] || SWAP_QUOTE_TIMEOUT_MAP.default),
        feeInfo: {
          feeComponent: [networkFee, tradeFee],
          defaultFeeToken: fromChainNativeTokenSlug,
          feeOptions: feeTokenOptions, // TODO: enable fee options
          selectedFeeToken
        },
        isLowLiquidity: Math.abs(quoteResponse.priceImpactPct) >= HYDRADX_LOW_LIQUIDITY_THRESHOLD,
        route: swapRoute,
        metadata: txHex
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

    const bnAmount = new BigNumber(params.quote.fromAmount);
    const bnDestinationAssetBalance = new BigNumber(destinationAssetBalance.value);

    let bnTotalAmount = bnAmount.minus(bnDestinationAssetBalance);

    if (_isNativeToken(originAsset)) {
      const bnXcmFee = new BigNumber(xcmFee.feeComponent[0].amount); // xcm fee is paid in native token but swap token is not always native token

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

  public async handleSetFeeStep (params: SwapSubmitParams): Promise<SwapSubmitStepData> {
    const substrateApi = this.chainService.getSubstrateApi(this.chain());
    const chainApi = await substrateApi.isReady;

    const swapStepIndex = params.process.steps.findIndex((step) => step.type === SwapStepType.SWAP);

    if (swapStepIndex <= -1) {
      return Promise.reject(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));
    }

    const swapFeeInfo = params.process.totalFee[swapStepIndex];
    const selectedFeeTokenSlug = swapFeeInfo.selectedFeeToken ?? swapFeeInfo.defaultFeeToken;

    const selectedFeeAsset = this.chainService.getAssetBySlug(selectedFeeTokenSlug);
    const extrinsic = chainApi.api.tx.multiTransactionPayment.setCurrency(_getTokenOnChainAssetId(selectedFeeAsset));

    const txData: RequestChangeFeeToken = {
      selectedFeeToken: selectedFeeTokenSlug
    };

    return {
      txChain: this.chain(),
      extrinsic,
      // extrinsicType: ExtrinsicType.SET_FEE_TOKEN,
      extrinsicType: ExtrinsicType.SWAP,
      chainType: ChainType.SUBSTRATE,
      txData
    } as SwapSubmitStepData;
  }

  public async handleSubmitStep (params: SwapSubmitParams): Promise<SwapSubmitStepData> {
    const txHex = params.quote.metadata as string;
    const fromAsset = this.chainService.getAssetBySlug(params.quote.pair.from);

    const substrateApi = this.chainService.getSubstrateApi(this.chain());

    const chainApi = await substrateApi.isReady;

    const txData: HydradxSwapTxData = {
      provider: this.providerInfo,
      quote: params.quote,
      address: params.address,
      slippage: params.slippage,
      txHex,
      process: params.process
    };

    let extrinsic: SubmittableExtrinsic<'promise'>;

    const txList: SubmittableExtrinsic<'promise'>[] = [];

    const swapTx = chainApi.api.tx(txHex);

    const _referral = await chainApi.api.query.referrals.linkedAccounts(params.address);
    const referral = _referral?.toString();
    const needSetReferral = !referral || referral === '';

    const steps = params.process.steps.map((step) => step.type);
    const needSetFeeToken = steps.includes(CommonStepType.SET_FEE_TOKEN);

    if (!needSetReferral && !needSetFeeToken) {
      extrinsic = swapTx;
    } else {
      if (needSetReferral) {
        txList.push(chainApi.api.tx.referrals.linkCode(this.referralCode));
      }

      if (needSetFeeToken) {
        const nativeTokenInfo = this.chainService.getNativeTokenInfo(this.chain());

        txList.push(chainApi.api.tx.multiTransactionPayment.setCurrency(_getTokenOnChainAssetId(nativeTokenInfo)));
      }

      txList.push(swapTx);
      extrinsic = chainApi.api.tx.utility.batchAll(txList);
    }

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
      case CommonStepType.DEFAULT:
        return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
      case CommonStepType.XCM:
        return this.handleXcmStep(params);
      case CommonStepType.SET_FEE_TOKEN:
        return this.handleSetFeeStep(params);
      case SwapStepType.SWAP:
        return this.handleSubmitStep(params);
      default:
        return this.handleSubmitStep(params);
    }
  }

  public async validateSwapProcess (params: ValidateSwapProcessParams): Promise<TransactionError[]> {
    const amount = params.selectedQuote.fromAmount;
    const bnAmount = new BigNumber(amount);

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
          case CommonStepType.SET_FEE_TOKEN:
            return this.swapBaseHandler.validateSetFeeTokenStep(params, index);
          default:
            return this.swapBaseHandler.validateSwapStep(params, isXcmOk, index);
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

  public async validateSwapRequest (request: SwapRequest): Promise<SwapEarlyValidation> {
    const fromAsset = this.chainService.getAssetBySlug(request.pair.from);
    const toAsset = this.chainService.getAssetBySlug(request.pair.to);

    const fromAssetId = _getTokenOnChainAssetId(fromAsset);
    const toAssetId = _getTokenOnChainAssetId(toAsset);

    try {
      // todo: might need to optimize for performance, but prioritize safety for now
      const allAssets = await this.tradeRouter?.getAllAssets();

      if (!allAssets) {
        return {
          error: SwapErrorType.UNKNOWN
        };
      }

      const supportedFromAsset = allAssets.find((asset) => asset.id === fromAssetId && asset.symbol === fromAsset.symbol);
      const supportedToAsset = allAssets.find((asset) => asset.id === toAssetId && asset.symbol === toAsset.symbol);

      if (!supportedFromAsset || !supportedToAsset) {
        return {
          error: SwapErrorType.ASSET_NOT_SUPPORTED
        };
      }

      const assetPairs = await this.tradeRouter?.getAssetPairs(fromAssetId);

      if (!assetPairs) {
        return {
          error: SwapErrorType.UNKNOWN
        };
      }

      const pairedToAsset = assetPairs.find((supportedToAsset) => supportedToAsset.id === toAssetId && supportedToAsset.symbol === toAsset.symbol);

      if (!pairedToAsset) {
        return {
          error: SwapErrorType.ASSET_NOT_SUPPORTED
        };
      }

      if (!(fromAsset.originChain === this.chain() && toAsset.originChain === this.chain())) {
        return {
          error: SwapErrorType.ASSET_NOT_SUPPORTED
        };
      }

      if (!fromAssetId || !toAssetId) {
        return {
          error: SwapErrorType.UNKNOWN
        };
      }

      const bnAmount = new BigNumber(request.fromAmount);

      if (bnAmount.lte(0)) {
        return {
          error: SwapErrorType.AMOUNT_CANNOT_BE_ZERO
        };
      }

      return {
        metadata: {
          chain: this.chainService.getChainInfoByKey(this.chain())
        } as HydradxPreValidationMetadata
      };
    } catch (e) {
      return {
        error: SwapErrorType.UNKNOWN
      };
    }
  }

  get referralCode () {
    if (this.isTestnet) {
      return HYDRADX_TESTNET_SUBWALLET_REFERRAL_CODE;
    }

    return HYDRADX_SUBWALLET_REFERRAL_CODE;
  }

  get referralAccount () {
    if (this.isTestnet) {
      return HYDRADX_TESTNET_SUBWALLET_REFERRAL_ACCOUNT;
    }

    return HYDRADX_SUBWALLET_REFERRAL_ACCOUNT;
  }
}
