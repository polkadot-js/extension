// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { _isNativeToken } from '@subwallet/extension-base/services/chain-service/utils';

export enum SWFeeType {
  EIP_1559 = 'EIP_1559',
  LEGACY = 'LEGACY',
  SUBSTRATE = 'SUBSTRATE' // todo: might need to be more specific
}

export interface FeeOption {
  // todo: consider slug
  tokenInfo: _ChainAsset;
  isDefault: boolean; // if it's the native token of the chain
  amount?: string;

  type: SWFeeType;
  metadata?: any; // todo: specify according to the type
}

export interface MultiFee {
  feeOptions: FeeOption[];
  totalFeeValue?: number; // in $
}

export class SWFee {
  public chain: string;
  public feeOptions: FeeOption[];
  private _selectedFeeOption?: FeeOption;
  private _transactionId?: string;

  get transactionId (): string | undefined {
    return this._transactionId;
  }

  get selectedFeeOption (): FeeOption | undefined {
    return this._selectedFeeOption;
  }

  public static build (feeOptions: FeeOption[], chain: string, selectedFeeOption?: FeeOption): SWFee {
    // todo: might need to parse metadata depending on the type
    if (selectedFeeOption) {
      return new SWFee(feeOptions, chain, selectedFeeOption);
    } else {
      const defaultFeeOption = feeOptions.find((option) => option.isDefault) as FeeOption;

      return new SWFee(feeOptions, chain, defaultFeeOption);
    }
  }

  public static buildSimpleFee (tokenInfo: _ChainAsset, amount: string, type: SWFeeType): SWFee { // used for simple transaction paid in native tokens
    const defaultOption = {
      tokenInfo,
      isDefault: _isNativeToken(tokenInfo), // if it's the native token of the chain
      amount,
      type
    } as FeeOption;

    return new SWFee([defaultOption], tokenInfo.originChain, defaultOption);
  }

  public static buildFeeOption (tokenInfo: _ChainAsset, amount: string, type: SWFeeType): FeeOption {
    // todo: calculate totalFeeValue
    // todo: implement more logic to handle complicated transaction process
    return {
      tokenInfo,
      isDefault: _isNativeToken(tokenInfo), // if it's the native token of the chain
      amount,
      type
    } as FeeOption;
  }

  public setTransactionId (transactionId: string) {
    this._transactionId = transactionId;
  }

  public setSelectedFeeOption (feeOption: FeeOption) {
    this._selectedFeeOption = feeOption;
  }

  constructor (feeOptions: FeeOption[], chain: string, selectedFeeOption?: FeeOption) {
    this.chain = chain;
    this.feeOptions = feeOptions;
    this._selectedFeeOption = selectedFeeOption;
  }

  public getDefaultFeeOption (): FeeOption {
    return this.feeOptions.find((option) => option.isDefault) as FeeOption;
  }
}
