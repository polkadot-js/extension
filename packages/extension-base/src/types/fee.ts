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
  tokenInfo: _ChainAsset;
  isDefault: boolean; // if it's the native token of the chain
  amount?: string;

  type: SWFeeType;
  metadata?: any; // todo: specify according to the type
}

export interface MultiFee {
  feeOptions: FeeOption[];
  selectedFeeOption?: FeeOption[];
  totalFeeValue?: number; // in $
}

export type FeeStruct = MultiFee[] | FeeOption;

export class SWFee {
  public chain: string;
  public feeStruct: FeeStruct;
  public isMultiFee: boolean = false;

  public static buildSimpleFee  (tokenInfo: _ChainAsset, amount: string, type: SWFeeType): SWFee {
     // todo: might need to parse metadata depending on the type
    return new SWFee({
      tokenInfo,
      isDefault: _isNativeToken(tokenInfo),
      amount,
      type
    }, tokenInfo.originChain);
  }

  public static buildMultiFee (feeOptions: FeeOption[]): MultiFee {
    // todo: calculate totalFeeValue
    // todo: implement more logic to handle complicated transaction process
    return {
      feeOptions
    };
  }

  constructor (feeStruct: FeeStruct, chain: string) {
    this.chain = chain;
    this.feeStruct = feeStruct;
    this.isMultiFee = 'feeOptions' in feeStruct;
  }

  public getDefaultFeeOption (): FeeOption {
    if (this.isMultiFee) {
      return (this.feeStruct as unknown as MultiFee).feeOptions.find((option) => option.isDefault) as FeeOption;
    } else {
      return this.feeStruct as FeeOption;
    }
  }
}
