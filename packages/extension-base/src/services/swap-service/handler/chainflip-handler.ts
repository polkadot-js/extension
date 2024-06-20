// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { SwapSDK } from '@chainflip/sdk/swap';
import { COMMON_ASSETS } from '@subwallet/chain-list';
import { _ChainAsset } from '@subwallet/chain-list/types';
import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ChainType, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainflipEarlyValidationError } from '@subwallet/extension-base/core/logic-validation/swap';
import { BalanceService } from '@subwallet/extension-base/services/balance-service';
import { getERC20TransactionObject, getEVMTransactionObject } from '@subwallet/extension-base/services/balance-service/transfer/smart-contract';
import { createTransferExtrinsic } from '@subwallet/extension-base/services/balance-service/transfer/token';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _getAssetDecimals, _getChainNativeTokenSlug, _getContractAddressOfToken, _isNativeToken, _isSubstrateChain } from '@subwallet/extension-base/services/chain-service/utils';
import { SwapBaseHandler, SwapBaseInterface } from '@subwallet/extension-base/services/swap-service/handler/base-handler';
import { calculateSwapRate, CHAIN_FLIP_SUPPORTED_MAINNET_ASSET_MAPPING, CHAIN_FLIP_SUPPORTED_MAINNET_MAPPING, CHAIN_FLIP_SUPPORTED_TESTNET_ASSET_MAPPING, CHAIN_FLIP_SUPPORTED_TESTNET_MAPPING, SWAP_QUOTE_TIMEOUT_MAP } from '@subwallet/extension-base/services/swap-service/utils';
import { TransactionData } from '@subwallet/extension-base/types';
import { BaseStepDetail, CommonFeeComponent, CommonOptimalPath, CommonStepFeeInfo, CommonStepType } from '@subwallet/extension-base/types/service-base';
import { ChainflipPreValidationMetadata, ChainflipSwapTxData, OptimalSwapPathParams, SwapEarlyValidation, SwapErrorType, SwapFeeType, SwapProviderId, SwapQuote, SwapRequest, SwapStepType, SwapSubmitParams, SwapSubmitStepData, ValidateSwapProcessParams } from '@subwallet/extension-base/types/swap';
import { AxiosError } from 'axios';
import BigNumber from 'bignumber.js';

import { SubmittableExtrinsic } from '@polkadot/api/types';

enum ChainflipFeeType {
  INGRESS = 'INGRESS',
  NETWORK = 'NETWORK',
  EGRESS = 'EGRESS',
  LIQUIDITY = 'LIQUIDITY'
}

const INTERMEDIARY_MAINNET_ASSET_SLUG = COMMON_ASSETS.USDC_ETHEREUM;
const INTERMEDIARY_TESTNET_ASSET_SLUG = COMMON_ASSETS.USDC_SEPOLIA;

enum CHAINFLIP_QUOTE_ERROR {
  InsufficientLiquidity = 'InsufficientLiquidity',
  InsufficientEgress = 'is lower than minimum egress amount',
  InsufficientIngress = 'amount is lower than estimated ingress fee',
}

export class ChainflipSwapHandler implements SwapBaseInterface {
  private swapSdk: SwapSDK;
  private readonly isTestnet: boolean;
  private swapBaseHandler: SwapBaseHandler;
  providerSlug: SwapProviderId;

  constructor (chainService: ChainService, balanceService: BalanceService, isTestnet = true) {
    this.swapBaseHandler = new SwapBaseHandler({
      chainService,
      balanceService,
      providerName: isTestnet ? 'Chainflip Testnet' : 'Chainflip',
      providerSlug: isTestnet ? SwapProviderId.CHAIN_FLIP_TESTNET : SwapProviderId.CHAIN_FLIP_MAINNET
    });
    this.isTestnet = isTestnet;
    this.providerSlug = isTestnet ? SwapProviderId.CHAIN_FLIP_TESTNET : SwapProviderId.CHAIN_FLIP_MAINNET;

    this.swapSdk = new SwapSDK({
      network: isTestnet ? 'perseverance' : 'mainnet'
    });
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

  get assetMapping () {
    if (this.isTestnet) {
      return CHAIN_FLIP_SUPPORTED_TESTNET_ASSET_MAPPING;
    } else {
      return CHAIN_FLIP_SUPPORTED_MAINNET_ASSET_MAPPING;
    }
  }

  get chainMapping () {
    if (this.isTestnet) {
      return CHAIN_FLIP_SUPPORTED_TESTNET_MAPPING;
    } else {
      return CHAIN_FLIP_SUPPORTED_MAINNET_MAPPING;
    }
  }

  get intermediaryAssetSlug () {
    if (this.isTestnet) {
      return INTERMEDIARY_TESTNET_ASSET_SLUG;
    } else {
      return INTERMEDIARY_MAINNET_ASSET_SLUG;
    }
  }

  public async validateSwapRequest (request: SwapRequest): Promise<SwapEarlyValidation> {
    try {
      // todo: risk of matching wrong chain, asset can lead to loss of funds

      const fromAsset = this.chainService.getAssetBySlug(request.pair.from);
      const toAsset = this.chainService.getAssetBySlug(request.pair.to);
      const srcChain = fromAsset.originChain;
      const destChain = toAsset.originChain;

      const srcChainInfo = this.chainService.getChainInfoByKey(srcChain);
      const srcChainId = this.chainMapping[srcChain];
      const destChainId = this.chainMapping[destChain];

      const fromAssetId = this.assetMapping[fromAsset.slug];
      const toAssetId = this.assetMapping[toAsset.slug];

      if (!srcChainId || !destChainId || !fromAssetId || !toAssetId) {
        return {
          error: SwapErrorType.ASSET_NOT_SUPPORTED
        };
      }

      const [supportedDestChains, srcAssets, destAssets] = await Promise.all([
        this.swapSdk.getChains(srcChainId),
        this.swapSdk.getAssets(srcChainId),
        this.swapSdk.getAssets(destChainId)
      ]);

      const supportedDestChainId = supportedDestChains.find((c) => c.chain === destChainId);
      const srcAssetData = srcAssets.find((a) => a.asset === fromAssetId);
      const destAssetData = destAssets.find((a) => a.asset === toAssetId);

      if (!destAssetData || !srcAssetData || !supportedDestChainId) {
        return { error: SwapErrorType.UNKNOWN };
      }

      const bnAmount = new BigNumber(request.fromAmount);
      const bnMinSwap = new BigNumber(srcAssetData.minimumSwapAmount);

      if (srcAssetData.maximumSwapAmount) {
        const bnMaxProtocolSwap = new BigNumber(srcAssetData.maximumSwapAmount);

        if (bnMinSwap.gte(bnMaxProtocolSwap)) {
          return { error: SwapErrorType.UNKNOWN };
        }

        if (bnAmount.gte(bnMaxProtocolSwap)) {
          return {
            error: SwapErrorType.SWAP_EXCEED_ALLOWANCE,
            metadata: {
              minSwap: {
                value: srcAssetData.minimumSwapAmount,
                decimals: _getAssetDecimals(fromAsset),
                symbol: fromAsset.symbol
              },
              maxSwap: {
                value: bnMaxProtocolSwap.toString(),
                decimals: _getAssetDecimals(fromAsset),
                symbol: fromAsset.symbol
              },
              chain: srcChainInfo
            } as ChainflipPreValidationMetadata
          };
        }
      }

      if (bnAmount.lt(bnMinSwap)) { // might miss case when minSwap is 0
        return {
          error: SwapErrorType.NOT_MEET_MIN_SWAP,
          metadata: {
            minSwap: {
              value: srcAssetData.minimumSwapAmount,
              decimals: _getAssetDecimals(fromAsset),
              symbol: fromAsset.symbol
            },
            maxSwap: {
              value: srcAssetData.maximumSwapAmount,
              decimals: _getAssetDecimals(fromAsset),
              symbol: fromAsset.symbol
            },
            chain: srcChainInfo
          } as ChainflipPreValidationMetadata
        };
      }

      return {
        metadata: {
          minSwap: {
            value: srcAssetData.minimumSwapAmount,
            decimals: _getAssetDecimals(fromAsset),
            symbol: fromAsset.symbol
          },
          maxSwap: {
            value: srcAssetData.maximumSwapAmount,
            decimals: _getAssetDecimals(fromAsset),
            symbol: fromAsset.symbol
          },
          chain: srcChainInfo
        } as ChainflipPreValidationMetadata
      };
    } catch (e) {
      return { error: SwapErrorType.UNKNOWN };
    }
  }

  private parseSwapPath (fromAsset: _ChainAsset, toAsset: _ChainAsset) {
    if (toAsset.slug !== this.intermediaryAssetSlug && fromAsset.slug !== this.intermediaryAssetSlug) { // Chainflip always use USDC as intermediary
      return [fromAsset.slug, this.intermediaryAssetSlug, toAsset.slug]; // todo: generalize this
    }

    return [fromAsset.slug, toAsset.slug];
  }

  public async getSwapQuote (request: SwapRequest): Promise<SwapQuote | SwapError> {
    const fromAsset = this.chainService.getAssetBySlug(request.pair.from);
    const toAsset = this.chainService.getAssetBySlug(request.pair.to);

    const fromChain = this.chainService.getChainInfoByKey(fromAsset.originChain);
    const fromChainNativeTokenSlug = _getChainNativeTokenSlug(fromChain);

    if (!fromAsset || !toAsset) {
      return new SwapError(SwapErrorType.UNKNOWN);
    }

    const earlyValidation = await this.validateSwapRequest(request);

    const metadata = earlyValidation.metadata as ChainflipPreValidationMetadata;

    if (earlyValidation.error) {
      return _getChainflipEarlyValidationError(earlyValidation.error, metadata);
    }

    const srcChainId = this.chainMapping[fromAsset.originChain];
    const destChainId = this.chainMapping[toAsset.originChain];

    const fromAssetId = this.assetMapping[fromAsset.slug];
    const toAssetId = this.assetMapping[toAsset.slug];

    try {
      const quoteResponse = await this.swapSdk.getQuote({
        srcChain: srcChainId,
        destChain: destChainId,
        srcAsset: fromAssetId,
        destAsset: toAssetId,
        amount: request.fromAmount
      });

      const feeComponent: CommonFeeComponent[] = [];

      quoteResponse.quote.includedFees.forEach((fee) => {
        switch (fee.type) {
          case ChainflipFeeType.INGRESS:

          // eslint-disable-next-line no-fallthrough
          case ChainflipFeeType.EGRESS: {
            const tokenSlug = Object.keys(this.assetMapping).find((assetSlug) => this.assetMapping[assetSlug] === fee.asset) as string;

            feeComponent.push({
              tokenSlug,
              amount: fee.amount,
              feeType: SwapFeeType.NETWORK_FEE
            });
            break;
          }

          case ChainflipFeeType.NETWORK:

          // eslint-disable-next-line no-fallthrough
          case ChainflipFeeType.LIQUIDITY: {
            const tokenSlug = Object.keys(this.assetMapping).find((assetSlug) => this.assetMapping[assetSlug] === fee.asset) as string;

            feeComponent.push({
              tokenSlug,
              amount: fee.amount,
              feeType: SwapFeeType.PLATFORM_FEE
            });
            break;
          }
        }
      });

      const defaultFeeToken = _isNativeToken(fromAsset) ? fromAsset.slug : fromChainNativeTokenSlug;

      return {
        pair: request.pair,
        fromAmount: request.fromAmount,
        toAmount: quoteResponse.quote.egressAmount.toString(),
        rate: calculateSwapRate(request.fromAmount, quoteResponse.quote.egressAmount.toString(), fromAsset, toAsset),
        provider: this.providerInfo,
        aliveUntil: +Date.now() + (SWAP_QUOTE_TIMEOUT_MAP[this.slug] || SWAP_QUOTE_TIMEOUT_MAP.default),
        minSwap: metadata.minSwap.value,
        maxSwap: metadata.maxSwap?.value,
        estimatedArrivalTime: quoteResponse.quote.estimatedDurationSeconds, // in seconds
        isLowLiquidity: quoteResponse.quote.lowLiquidityWarning,
        feeInfo: {
          feeComponent: feeComponent,
          defaultFeeToken,
          feeOptions: [defaultFeeToken]
        },
        route: {
          path: this.parseSwapPath(fromAsset, toAsset)
        }
      } as SwapQuote;
    } catch (e) {
      const error = e as AxiosError;
      const errorObj = error?.response?.data as Record<string, string>;

      if (errorObj && errorObj.error && errorObj.error.includes(CHAINFLIP_QUOTE_ERROR.InsufficientLiquidity)) { // todo: Chainflip will improve this
        return new SwapError(SwapErrorType.NOT_ENOUGH_LIQUIDITY);
      }

      if (errorObj && errorObj.message && errorObj.message.includes(CHAINFLIP_QUOTE_ERROR.InsufficientLiquidity)) {
        return new SwapError(SwapErrorType.NOT_ENOUGH_LIQUIDITY);
      }

      return new SwapError(SwapErrorType.ERROR_FETCHING_QUOTE);
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
          case CommonStepType.TOKEN_APPROVAL:
            return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
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

  public async handleSubmitStep (params: SwapSubmitParams): Promise<SwapSubmitStepData> {
    const { address, quote, recipient } = params;

    const pair = quote.pair;
    const fromAsset = this.chainService.getAssetBySlug(pair.from);
    const toAsset = this.chainService.getAssetBySlug(pair.to);
    const chainInfo = this.chainService.getChainInfoByKey(fromAsset.originChain);
    const chainType = _isSubstrateChain(chainInfo) ? ChainType.SUBSTRATE : ChainType.EVM;
    const receiver = recipient ?? address;

    const srcChainId = this.chainMapping[fromAsset.originChain];
    const destChainId = this.chainMapping[toAsset.originChain];

    const fromAssetId = this.assetMapping[fromAsset.slug];
    const toAssetId = this.assetMapping[toAsset.slug];

    const depositAddressResponse = await this.swapSdk.requestDepositAddress({
      srcChain: srcChainId,
      destChain: destChainId,
      srcAsset: fromAssetId,
      destAsset: toAssetId,
      destAddress: receiver,
      amount: quote.fromAmount
    });

    const txData: ChainflipSwapTxData = {
      address,
      provider: this.providerInfo,
      quote: params.quote,
      slippage: params.slippage,
      recipient,
      depositChannelId: depositAddressResponse.depositChannelId,
      depositAddress: depositAddressResponse.depositAddress,
      process: params.process
    };

    let extrinsic: TransactionData;

    if (chainType === ChainType.SUBSTRATE) {
      const chainApi = this.chainService.getSubstrateApi(chainInfo.slug);

      const substrateApi = await chainApi.isReady;

      const [submittableExtrinsic] = await createTransferExtrinsic({
        from: address,
        networkKey: chainInfo.slug,
        substrateApi,
        to: depositAddressResponse.depositAddress,
        tokenInfo: fromAsset,
        transferAll: false, // always false, because we do not allow swapping all the balance
        value: quote.fromAmount
      });

      extrinsic = submittableExtrinsic as SubmittableExtrinsic<'promise'>;
    } else {
      if (_isNativeToken(fromAsset)) {
        const [transactionConfig] = await getEVMTransactionObject(chainInfo, address, depositAddressResponse.depositAddress, quote.fromAmount, false, this.chainService.getEvmApi(chainInfo.slug));

        extrinsic = transactionConfig;
      } else {
        const [transactionConfig] = await getERC20TransactionObject(_getContractAddressOfToken(fromAsset), chainInfo, address, depositAddressResponse.depositAddress, quote.fromAmount, false, this.chainService.getEvmApi(chainInfo.slug));

        extrinsic = transactionConfig;
      }
    }

    return {
      txChain: fromAsset.originChain,
      txData,
      extrinsic,
      transferNativeAmount: _isNativeToken(fromAsset) ? quote.fromAmount : '0', // todo
      extrinsicType: ExtrinsicType.SWAP,
      chainType
    } as SwapSubmitStepData;
  }

  public async handleSwapProcess (params: SwapSubmitParams): Promise<SwapSubmitStepData> {
    const { currentStep, process } = params;
    const type = process.steps[currentStep].type;

    switch (type) {
      case CommonStepType.DEFAULT:
        return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
      case SwapStepType.SWAP:
        return this.handleSubmitStep(params);
      default:
        return this.handleSubmitStep(params);
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
      this.getSubmitStep
    ]);
  }
}
