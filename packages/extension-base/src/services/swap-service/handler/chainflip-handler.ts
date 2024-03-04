// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { SwapSDK } from '@chainflip/sdk/swap';
import { _ChainAsset } from '@subwallet/chain-list/types';
import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ChainType, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { createTransferExtrinsic } from '@subwallet/extension-base/koni/api/dotsama/transfer';
import { getEVMTransactionObject } from '@subwallet/extension-base/koni/api/tokens/evm/transfer';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _isSubstrateChain } from '@subwallet/extension-base/services/chain-service/utils';
import { SwapBaseHandler } from '@subwallet/extension-base/services/swap-service/handler/base-handler';
import { calculateSwapRate, CHAIN_FLIP_SUPPORTED_ASSET_MAPPING, CHAIN_FLIP_SUPPORTED_CHAIN_MAPPING, DEFAULT_SWAP_FIRST_STEP, MOCK_SWAP_FEE, SWAP_QUOTE_TIMEOUT_MAP } from '@subwallet/extension-base/services/swap-service/utils';
import { TransactionData } from '@subwallet/extension-base/types';
import { ChainflipTxData, OptimalSwapPath, OptimalSwapPathParams, SwapEarlyValidation, SwapErrorType, SwapFeeComponent, SwapFeeType, SwapQuote, SwapRequest, SwapStepType, SwapSubmitParams, SwapSubmitStepData, ValidateSwapProcessParams } from '@subwallet/extension-base/types/swap';
import BigN from 'bignumber.js';

import { SubmittableExtrinsic } from '@polkadot/api/types';

interface ChainflipPreValidationMetadata {
  minSwap: string;
  maxSwap?: string;
}

enum ChainflipFeeType {
  INGRESS = 'INGRESS',
  NETWORK = 'NETWORK',
  EGRESS = 'EGRESS',
  LIQUIDITY = 'LIQUIDITY'
}

// const INTERMEDIARY_ASSET_SLUG = 'ethereum-ERC20-USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const INTERMEDIARY_ASSET_SLUG = 'ethereum_goerli-ERC20-0x07865c6E87B9F70255377e024ace6630C1Eaa37F';

export class ChainflipSwapHandler extends SwapBaseHandler {
  private swapSdk: SwapSDK;
  private chainService: ChainService;

  constructor (providerSlug: string, providerName: string, chainService: ChainService) {
    super(providerSlug, providerName);

    this.swapSdk = new SwapSDK({
      network: 'perseverance'
    });
    this.chainService = chainService;
  }

  protected async validateSwapRequest (request: SwapRequest): Promise<SwapEarlyValidation> {
    try {
      // todo: risk of matching wrong chain, asset can lead to loss of funds

      const fromAsset = this.chainService.getAssetBySlug(request.pair.from);
      const toAsset = this.chainService.getAssetBySlug(request.pair.to);
      const srcChain = fromAsset.originChain;
      const destChain = toAsset.originChain;

      const bnAmount = new BigN(request.fromAmount);

      const srcChainId = CHAIN_FLIP_SUPPORTED_CHAIN_MAPPING[srcChain];
      const destChainId = CHAIN_FLIP_SUPPORTED_CHAIN_MAPPING[destChain];

      const fromAssetId = CHAIN_FLIP_SUPPORTED_ASSET_MAPPING[fromAsset.slug];
      const toAssetId = CHAIN_FLIP_SUPPORTED_ASSET_MAPPING[toAsset.slug];

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
        return { error: SwapErrorType.ASSET_NOT_SUPPORTED };
      }

      const bnMinSwap = new BigN(srcAssetData.minimumSwapAmount);

      if (bnAmount.lt(bnMinSwap)) {
        return {
          error: SwapErrorType.NOT_MEET_MIN_SWAP,
          metadata: {
            minSwap: srcAssetData.minimumSwapAmount,
            maxSwap: srcAssetData.maximumSwapAmount
          } as ChainflipPreValidationMetadata
        };
      }

      if (srcAssetData.maximumSwapAmount) {
        const bnMaxSwap = new BigN(srcAssetData.maximumSwapAmount);

        if (bnAmount.gt(bnMaxSwap)) {
          return {
            error: SwapErrorType.EXCEED_MAX_SWAP,
            metadata: {
              minSwap: srcAssetData.minimumSwapAmount,
              maxSwap: srcAssetData.maximumSwapAmount
            } as ChainflipPreValidationMetadata
          };
        }
      }

      return {
        metadata: {
          minSwap: srcAssetData.minimumSwapAmount,
          maxSwap: srcAssetData.maximumSwapAmount
        } as ChainflipPreValidationMetadata
      };
    } catch (e) {
      console.log('Error validating swap request', e);

      return { error: SwapErrorType.UNKNOWN };
    }
  }

  private parseSwapPath (fromAsset: _ChainAsset, toAsset: _ChainAsset) {
    if (toAsset.slug !== INTERMEDIARY_ASSET_SLUG) { // Chainflip always use USDC as intermediary
      return [fromAsset.slug, INTERMEDIARY_ASSET_SLUG, toAsset.slug]; // todo: generalize this
    }

    return [fromAsset.slug, toAsset.slug];
  }

  public async getSwapQuote (request: SwapRequest): Promise<SwapQuote | SwapError> {
    const fromAsset = this.chainService.getAssetBySlug(request.pair.from);
    const toAsset = this.chainService.getAssetBySlug(request.pair.to);

    if (!fromAsset || !toAsset) {
      return new SwapError(SwapErrorType.UNKNOWN);
    }

    const earlyValidation = await this.validateSwapRequest(request);
    const metadata = earlyValidation.metadata as ChainflipPreValidationMetadata;

    if (earlyValidation.error) {
      return new SwapError(earlyValidation.error);
    }

    const srcChainId = CHAIN_FLIP_SUPPORTED_CHAIN_MAPPING[fromAsset.originChain];
    const destChainId = CHAIN_FLIP_SUPPORTED_CHAIN_MAPPING[toAsset.originChain];

    const fromAssetId = CHAIN_FLIP_SUPPORTED_ASSET_MAPPING[fromAsset.slug];
    const toAssetId = CHAIN_FLIP_SUPPORTED_ASSET_MAPPING[toAsset.slug];

    try {
      const quoteResponse = await this.swapSdk.getQuote({
        srcChain: srcChainId,
        destChain: destChainId,
        srcAsset: fromAssetId,
        destAsset: toAssetId,
        amount: request.fromAmount
      });

      const feeComponent: SwapFeeComponent[] = [];

      quoteResponse.quote.includedFees.forEach((fee) => {
        switch (fee.type) {
          case ChainflipFeeType.INGRESS:
          case ChainflipFeeType.NETWORK:

          // eslint-disable-next-line no-fallthrough
          case ChainflipFeeType.EGRESS: {
            const tokenSlug = Object.keys(CHAIN_FLIP_SUPPORTED_ASSET_MAPPING).find((assetSlug) => CHAIN_FLIP_SUPPORTED_ASSET_MAPPING[assetSlug] === fee.asset) as string;

            feeComponent.push({
              tokenSlug,
              amount: fee.amount,
              feeType: SwapFeeType.NETWORK_FEE
            });
            break;
          }

          case ChainflipFeeType.LIQUIDITY: {
            const tokenSlug = Object.keys(CHAIN_FLIP_SUPPORTED_ASSET_MAPPING).find((assetSlug) => CHAIN_FLIP_SUPPORTED_ASSET_MAPPING[assetSlug] === fee.asset) as string;

            feeComponent.push({
              tokenSlug,
              amount: fee.amount,
              feeType: SwapFeeType.PLATFORM_FEE
            });
            break;
          }
        }
      });

      return {
        pair: request.pair,
        fromAmount: request.fromAmount,
        toAmount: quoteResponse.quote.egressAmount.toString(),
        rate: calculateSwapRate(request.fromAmount, quoteResponse.quote.egressAmount.toString(), fromAsset, toAsset),
        provider: this.providerInfo,
        aliveUntil: +Date.now() + SWAP_QUOTE_TIMEOUT_MAP[this.slug],
        minSwap: metadata.minSwap,
        maxSwap: metadata.maxSwap,
        feeInfo: {
          feeComponent: feeComponent,
          defaultFeeToken: fromAsset.slug, // todo
          feeOptions: [fromAsset.slug] // todo
        },
        route: {
          path: this.parseSwapPath(fromAsset, toAsset)
        }
      } as SwapQuote;
    } catch (e) {
      console.error('Error getting quote from Chainflip', e);
      // todo: handle more error from chainflip

      return new SwapError(SwapErrorType.ERROR_FETCHING_QUOTE);
    }
  }

  public validateSwapProcess (params: ValidateSwapProcessParams): Promise<TransactionError[]> {
    return Promise.resolve([]);
  }

  protected async handleSubmitStep (params: SwapSubmitParams): Promise<SwapSubmitStepData> {
    const { address, quote, recipient } = params;

    const pair = quote.pair;
    const fromAsset = this.chainService.getAssetBySlug(pair.from);
    const toAsset = this.chainService.getAssetBySlug(pair.to);
    const chainInfo = this.chainService.getChainInfoByKey(fromAsset.originChain);
    const chainType = _isSubstrateChain(chainInfo) ? ChainType.SUBSTRATE : ChainType.EVM;
    const receiver = recipient ?? address;

    const srcChainId = CHAIN_FLIP_SUPPORTED_CHAIN_MAPPING[fromAsset.originChain];
    const destChainId = CHAIN_FLIP_SUPPORTED_CHAIN_MAPPING[toAsset.originChain];

    const fromAssetId = CHAIN_FLIP_SUPPORTED_ASSET_MAPPING[fromAsset.slug];
    const toAssetId = CHAIN_FLIP_SUPPORTED_ASSET_MAPPING[toAsset.slug];

    const depositAddressResponse = await this.swapSdk.requestDepositAddress({
      srcChain: srcChainId,
      destChain: destChainId,
      srcAsset: fromAssetId,
      destAsset: toAssetId,
      destAddress: receiver,
      amount: quote.fromAmount
    });

    const txData: ChainflipTxData = {
      address,
      provider: this.providerInfo,
      quote: params.quote,
      slippage: params.slippage,
      recipient,
      depositChannelId: depositAddressResponse.depositChannelId,
      depositAddress: depositAddressResponse.depositAddress
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
        transferAll: false, // todo
        value: quote.fromAmount
      });

      extrinsic = submittableExtrinsic as SubmittableExtrinsic<'promise'>;
    } else {
      const [transactionConfig] = await getEVMTransactionObject(chainInfo, address, depositAddressResponse.depositAddress, quote.fromAmount, false, this.chainService.getEvmApiMap());

      extrinsic = transactionConfig;
    }

    return {
      txChain: fromAsset.originChain,
      txData,
      extrinsic,
      transferNativeAmount: quote.fromAmount,
      extrinsicType: ExtrinsicType.SWAP,
      chainType
    } as SwapSubmitStepData;
  }

  public override async handleSwapProcess (params: SwapSubmitParams): Promise<SwapSubmitStepData> {
    const { currentStep, process } = params;
    const type = process.steps[currentStep].type;

    switch (type) {
      case SwapStepType.DEFAULT:
        return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
      case SwapStepType.SWAP:
        return this.handleSubmitStep(params);
      default:
        return this.handleSubmitStep(params);
    }
  }

  generateOptimalProcess (params: OptimalSwapPathParams): Promise<OptimalSwapPath> {
    const result: OptimalSwapPath = {
      totalFee: [MOCK_SWAP_FEE],
      steps: [DEFAULT_SWAP_FIRST_STEP]
    };

    if (params.selectedQuote) {
      result.totalFee.push(params.selectedQuote.feeInfo);
      result.steps.push({
        id: result.steps.length,
        name: 'Swap',
        type: SwapStepType.SWAP
      });
    } else { // todo: improve this
      result.totalFee.push({
        feeComponent: [],
        feeOptions: [params.request.pair.from],
        defaultFeeToken: params.request.pair.from
      });
      result.steps.push({
        id: result.steps.length,
        name: 'Swap',
        type: SwapStepType.SWAP
      });
    }

    return Promise.resolve(result);
  }
}
