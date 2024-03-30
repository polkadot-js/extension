// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { BalanceService } from '@subwallet/extension-base/services/balance-service';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _getAssetDecimals, _getTokenMinAmount, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { DEFAULT_SWAP_FIRST_STEP, MOCK_SWAP_FEE } from '@subwallet/extension-base/services/swap-service/utils';
import { BaseStepDetail } from '@subwallet/extension-base/types/service-base';
import { GenSwapStepFunc, OptimalSwapPath, OptimalSwapPathParams, SwapEarlyValidation, SwapErrorType, SwapFeeInfo, SwapProvider, SwapProviderId, SwapQuote, SwapRequest, SwapSubmitParams, SwapSubmitStepData, ValidateSwapProcessParams } from '@subwallet/extension-base/types/swap';
import { formatNumber } from '@subwallet/extension-base/utils';
import BigNumber from 'bignumber.js';

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

  // protected abstract validateSwapRequest(request: SwapRequest): Promise<SwapEarlyValidation>;
  // public abstract validateSwapProcess (params: ValidateSwapProcessParams): Promise<TransactionError[]>;
  public async validateXcmStep (params: ValidateSwapProcessParams): Promise<TransactionError[]> {
    return Promise.resolve([]);
  }

  public async validateTokenApproveStep (params: ValidateSwapProcessParams): Promise<TransactionError[]> {
    return Promise.resolve([]);
  }

  public async validateSwapStep (params: ValidateSwapProcessParams, isXcmOk: boolean): Promise<TransactionError[]> {
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

    const fromAssetBalance = await this.balanceService.getTokenFreeBalance(params.address, fromAsset.originChain, fromAsset.slug);
    const bnFromAssetBalance = new BigNumber(fromAssetBalance.value);

    if (params.selectedQuote.minSwap) {
      const minProtocolSwap = new BigNumber(params.selectedQuote.minSwap);

      if (bnFromAssetBalance.lte(minProtocolSwap)) {
        const parsedMinSwapValue = formatNumber(minProtocolSwap, _getAssetDecimals(fromAsset));

        return Promise.resolve([new TransactionError(SwapErrorType.SWAP_NOT_ENOUGH_BALANCE,
          `Insufficient balance. You need more than ${parsedMinSwapValue} ${fromAsset.symbol} to start swapping. Deposit ${fromAsset.symbol} and try again.`)]); // todo: min swap or amount?
      }
    }

    const bnSrcAssetMinAmount = new BigNumber(_getTokenMinAmount(fromAsset));
    const bnMaxBalanceSwap = bnFromAssetBalance.minus(bnSrcAssetMinAmount);

    if (bnAmount.gte(bnMaxBalanceSwap)) {
      const parsedMaxBalanceSwap = formatNumber(bnMaxBalanceSwap, _getAssetDecimals(fromAsset));

      return Promise.resolve([new TransactionError(SwapErrorType.SWAP_EXCEED_ALLOWANCE,
        `Amount too high. Lower your amount below ${parsedMaxBalanceSwap} ${fromAsset.symbol} and try again`)]);
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

  // public abstract handleSwapProcess (params: SwapSubmitParams): Promise<SwapSubmitStepData>;
  // protected abstract handleSubmitStep (params: SwapSubmitParams): Promise<SwapSubmitStepData>;

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
