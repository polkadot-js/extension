// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { BalanceService } from '@subwallet/extension-base/services/balance-service';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { DEFAULT_SWAP_FIRST_STEP, MOCK_SWAP_FEE } from '@subwallet/extension-base/services/swap-service/utils';
import { BaseStepDetail } from '@subwallet/extension-base/types/service-base';
import { GenSwapStepFunc, OptimalSwapPath, OptimalSwapPathParams, SwapEarlyValidation, SwapErrorType, SwapFeeInfo, SwapProvider, SwapProviderId, SwapQuote, SwapRequest, SwapSubmitParams, SwapSubmitStepData, ValidateSwapProcessParams } from '@subwallet/extension-base/types/swap';

import { isEthereumAddress } from '@polkadot/util-crypto';

export interface SwapBaseInterface {
  getSwapQuote: (request: SwapRequest) => Promise<SwapQuote | SwapError>;
  generateOptimalProcess: (params: OptimalSwapPathParams) => Promise<OptimalSwapPath>;

  getTokenApproveStep?: (params: OptimalSwapPathParams) => Promise<[BaseStepDetail, SwapFeeInfo] | undefined>;
  getXcmStep?: (params: OptimalSwapPathParams) => Promise<[BaseStepDetail, SwapFeeInfo] | undefined>;
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

  public async validateJoinStep (params: ValidateSwapProcessParams, isXcmOk: boolean): Promise<TransactionError[]> {
    if (!params.selectedQuote) {
      return Promise.resolve([new TransactionError(BasicTxErrorType.INTERNAL_ERROR)]);
    }

    const selectedQuote = params.selectedQuote;
    const currentTimestamp = +Date.now();

    if (selectedQuote.aliveUntil <= currentTimestamp) {
      return Promise.resolve([new TransactionError(SwapErrorType.QUOTE_TIMEOUT)]);
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
