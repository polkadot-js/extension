// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { SwapSDK } from '@chainflip/sdk/swap';
import { _ChainAsset } from '@subwallet/chain-list/types';
import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { AmountData, BasicTxErrorType, ChainType, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { createTransferExtrinsic } from '@subwallet/extension-base/koni/api/dotsama/transfer';
import { getEVMTransactionObject } from '@subwallet/extension-base/koni/api/tokens/evm/transfer';
import { BalanceService } from '@subwallet/extension-base/services/balance-service';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _getAssetDecimals, _getAssetSymbol, _getTokenMinAmount, _isNativeToken, _isSubstrateChain } from '@subwallet/extension-base/services/chain-service/utils';
import { SwapBaseHandler } from '@subwallet/extension-base/services/swap-service/handler/base-handler';
import { calculateSwapRate, CHAIN_FLIP_SUPPORTED_MAINNET_ASSET_MAPPING, CHAIN_FLIP_SUPPORTED_MAINNET_MAPPING, CHAIN_FLIP_SUPPORTED_TESTNET_ASSET_MAPPING, CHAIN_FLIP_SUPPORTED_TESTNET_MAPPING, DEFAULT_SWAP_FIRST_STEP, getSwapEarlyValidationError, MOCK_SWAP_FEE, SWAP_QUOTE_TIMEOUT_MAP } from '@subwallet/extension-base/services/swap-service/utils';
import { TransactionData, YieldStepType } from '@subwallet/extension-base/types';
import { ChainflipPreValidationMetadata, ChainflipTxData, OptimalSwapPath, OptimalSwapPathParams, SwapEarlyValidation, SwapErrorType, SwapFeeComponent, SwapFeeType, SwapQuote, SwapRequest, SwapStepType, SwapSubmitParams, SwapSubmitStepData, ValidateSwapProcessParams } from '@subwallet/extension-base/types/swap';
import BigNumber from 'bignumber.js';

import { SubmittableExtrinsic } from '@polkadot/api/types';

enum ChainflipFeeType {
  INGRESS = 'INGRESS',
  NETWORK = 'NETWORK',
  EGRESS = 'EGRESS',
  LIQUIDITY = 'LIQUIDITY'
}

const INTERMEDIARY_MAINNET_ASSET_SLUG = 'ethereum-ERC20-USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const INTERMEDIARY_TESTNET_ASSET_SLUG = 'ethereum_goerli-ERC20-USDC-0x07865c6E87B9F70255377e024ace6630C1Eaa37F';

export class ChainflipSwapHandler extends SwapBaseHandler {
  private swapSdk: SwapSDK;
  private isTestnet: boolean;

  constructor (providerSlug: string, providerName: string, chainService: ChainService, balanceService: BalanceService, isTestnet = true) {
    super(providerSlug, providerName, chainService, balanceService);
    this.isTestnet = isTestnet;

    this.swapSdk = new SwapSDK({
      network: isTestnet ? 'perseverance' : 'mainnet'
    });
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

  protected async validateSwapRequest (request: SwapRequest): Promise<SwapEarlyValidation> {
    try {
      // todo: risk of matching wrong chain, asset can lead to loss of funds

      const fromAsset = this.chainService.getAssetBySlug(request.pair.from);
      const toAsset = this.chainService.getAssetBySlug(request.pair.to);
      const srcChain = fromAsset.originChain;
      const destChain = toAsset.originChain;

      const srcChainInfo = this.chainService.getChainInfoByKey(srcChain);

      const bnAmount = new BigNumber(request.fromAmount);

      const srcChainId = this.chainMapping[srcChain];
      const destChainId = this.chainMapping[destChain];

      const fromAssetId = this.assetMapping[fromAsset.slug];
      const toAssetId = this.assetMapping[toAsset.slug];

      const fromAssetBalance = await this.balanceService.getTokenFreeBalance(request.address, srcChain, fromAsset.slug);

      const bnFromAssetBalance = new BigNumber(fromAssetBalance.value);

      if (bnAmount.gte(bnFromAssetBalance)) {
        return {
          error: SwapErrorType.SWAP_EXCEED_BALANCE
        };
      }

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

      const bnMinSwap = new BigNumber(srcAssetData.minimumSwapAmount);

      if (bnAmount.lt(bnMinSwap)) {
        return {
          error: SwapErrorType.NOT_MEET_MIN_SWAP,
          metadata: {
            minSwap: {
              value: srcAssetData.minimumSwapAmount,
              decimals: fromAsset.decimals,
              symbol: fromAsset.symbol
            },
            maxSwap: {
              value: srcAssetData.maximumSwapAmount,
              decimals: toAsset.decimals,
              symbol: toAsset.symbol
            }
          } as ChainflipPreValidationMetadata
        };
      }

      if (srcAssetData.maximumSwapAmount) {
        const bnMaxSwap = new BigNumber(srcAssetData.maximumSwapAmount);

        if (bnAmount.gt(bnMaxSwap)) {
          return {
            error: SwapErrorType.EXCEED_MAX_SWAP,
            metadata: {
              minSwap: {
                value: srcAssetData.minimumSwapAmount,
                decimals: fromAsset.decimals,
                symbol: fromAsset.symbol
              },
              maxSwap: {
                value: srcAssetData.maximumSwapAmount,
                decimals: toAsset.decimals,
                symbol: toAsset.symbol
              }
            } as ChainflipPreValidationMetadata
          };
        }
      }

      return {
        metadata: {
          minSwap: {
            value: srcAssetData.minimumSwapAmount,
            decimals: fromAsset.decimals,
            symbol: fromAsset.symbol
          },
          maxSwap: {
            value: srcAssetData.maximumSwapAmount,
            decimals: toAsset.decimals,
            symbol: toAsset.symbol
          },
          chain: srcChainInfo
        } as ChainflipPreValidationMetadata
      };
    } catch (e) {
      console.log('Error validating swap request', e);

      return { error: SwapErrorType.UNKNOWN };
    }
  }

  private parseSwapPath (fromAsset: _ChainAsset, toAsset: _ChainAsset) {
    if (toAsset.slug !== this.intermediaryAssetSlug) { // Chainflip always use USDC as intermediary
      return [fromAsset.slug, this.intermediaryAssetSlug, toAsset.slug]; // todo: generalize this
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
    const fromAssetBalance = await this.balanceService.getTokenFreeBalance(request.address, fromAsset.originChain, fromAsset.slug);
    const bnSrcAssetMinAmount = new BigNumber(_getTokenMinAmount(fromAsset));
    const bnSwapAllowed = new BigNumber(fromAssetBalance.value).minus(bnSrcAssetMinAmount);
    const swapAllowed: AmountData = {
      value: bnSwapAllowed.toString(),
      decimals: _getAssetDecimals(fromAsset),
      symbol: _getAssetSymbol(fromAsset)
    };
    const metadata = earlyValidation.metadata as ChainflipPreValidationMetadata;

    if (earlyValidation.error) {
      return getSwapEarlyValidationError(earlyValidation.error, metadata, swapAllowed);
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

      const feeComponent: SwapFeeComponent[] = [];

      quoteResponse.quote.includedFees.forEach((fee) => {
        switch (fee.type) {
          case ChainflipFeeType.INGRESS:
          case ChainflipFeeType.NETWORK:

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

      return {
        pair: request.pair,
        fromAmount: request.fromAmount,
        toAmount: quoteResponse.quote.egressAmount.toString(),
        rate: calculateSwapRate(request.fromAmount, quoteResponse.quote.egressAmount.toString(), fromAsset, toAsset),
        provider: this.providerInfo,
        aliveUntil: +Date.now() + SWAP_QUOTE_TIMEOUT_MAP[this.slug],
        minSwap: metadata.minSwap.value,
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

  public async validateSwapProcess (params: ValidateSwapProcessParams): Promise<TransactionError[]> {
    const amount = params.selectedQuote.fromAmount;
    const bnAmount = new BigNumber(amount);

    if (bnAmount.lte(0)) {
      return [new TransactionError(BasicTxErrorType.INVALID_PARAMS, 'Amount must be greater than 0')];
    }

    let isXcmOk = false;

    for (const step of params.process.steps) {
      const getErrors = async (): Promise<TransactionError[]> => {
        switch (step.type) {
          case SwapStepType.DEFAULT:
            return Promise.resolve([]);
          case SwapStepType.XCM:
            return this.validateXcmStep(params);
          case SwapStepType.TOKEN_APPROVAL:
            return this.validateTokenApproveStep(params);
          default:
            return this.validateJoinStep(params, isXcmOk);
        }
      };

      const errors = await getErrors();

      if (errors.length) {
        return errors;
      } else if (step.type === YieldStepType.XCM) {
        isXcmOk = true;
      }
    }

    return [];
  }

  protected async handleSubmitStep (params: SwapSubmitParams): Promise<SwapSubmitStepData> {
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
        transferAll: false, // always false, because we do not allow swapping all the balance
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
      transferNativeAmount: _isNativeToken(fromAsset) ? quote.fromAmount : '0', // todo
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
