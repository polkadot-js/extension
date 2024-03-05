// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { OptimalSwapPath, OptimalSwapPathParams, SwapEarlyValidation, SwapErrorType, SwapProvider, SwapProviderId, SwapQuote, SwapRequest, SwapSubmitParams, SwapSubmitStepData, ValidateSwapProcessParams } from '@subwallet/extension-base/types/swap';

import { isEthereumAddress } from '@polkadot/util-crypto';

export abstract class SwapBaseHandler {
  protected providerSlug: string;
  protected providerName: string;
  protected chainService: ChainService;

  protected constructor (providerSlug: string, providerName: string, chainService: ChainService) {
    this.providerName = providerName;
    this.providerSlug = providerSlug;
    this.chainService = chainService;
  }

  public abstract getSwapQuote(request: SwapRequest): Promise<SwapQuote | SwapError>;
  public abstract generateOptimalProcess(params: OptimalSwapPathParams): Promise<OptimalSwapPath>;

  protected abstract validateSwapRequest(request: SwapRequest): Promise<SwapEarlyValidation>;
  public abstract validateSwapProcess (params: ValidateSwapProcessParams): Promise<TransactionError[]>;
  protected async validateXcmStep (params: ValidateSwapProcessParams): Promise<TransactionError[]> {
    return Promise.resolve([]);
  }

  protected async validateTokenApproveStep (params: ValidateSwapProcessParams): Promise<TransactionError[]> {
    return Promise.resolve([]);
  }

  protected async validateJoinStep (params: ValidateSwapProcessParams, isXcmOk: boolean): Promise<TransactionError[]> {
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

  public abstract handleSwapProcess (params: SwapSubmitParams): Promise<SwapSubmitStepData>;
  protected abstract handleSubmitStep (params: SwapSubmitParams): Promise<SwapSubmitStepData>;

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
