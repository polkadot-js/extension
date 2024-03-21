// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { BalanceService } from '@subwallet/extension-base/services/balance-service';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { OptimalSwapPath, OptimalSwapPathParams, SwapEarlyValidation, SwapErrorType, SwapProvider, SwapProviderId, SwapQuote, SwapRequest, SwapSubmitParams, SwapSubmitStepData, ValidateSwapProcessParams } from '@subwallet/extension-base/types/swap';

import { isEthereumAddress } from '@polkadot/util-crypto';

// Implement composite design pattern to avoid complex inheritance

export interface SwapBaseInterface {
  getSwapQuote(request: SwapRequest): Promise<SwapQuote | SwapError>;
  generateOptimalProcess(params: OptimalSwapPathParams): Promise<OptimalSwapPath>;

  validateSwapRequest(request: SwapRequest): Promise<SwapEarlyValidation>;
  validateSwapProcess(params: ValidateSwapProcessParams): Promise<TransactionError[]>;

  handleSwapProcess(params: SwapSubmitParams): Promise<SwapSubmitStepData>;
  handleSubmitStep(params: SwapSubmitParams): Promise<SwapSubmitStepData>
}

export class SwapBaseHandler {
  private readonly providerSlug: string;
  private readonly providerName: string;
  public chainService: ChainService;
  public balanceService: BalanceService;

  public constructor (providerSlug: string, providerName: string, chainService: ChainService, balanceService: BalanceService) {
    this.providerName = providerName;
    this.providerSlug = providerSlug;
    this.chainService = chainService;
    this.balanceService = balanceService;
  }

  // public abstract getSwapQuote(request: SwapRequest): Promise<SwapQuote | SwapError>;
  // public abstract generateOptimalProcess(params: OptimalSwapPathParams): Promise<OptimalSwapPath>;

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
