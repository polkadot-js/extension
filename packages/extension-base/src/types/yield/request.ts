// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { TransactionConfig } from 'web3-core';

import { SubmittableExtrinsic } from '@polkadot/api/types';

export interface HandleYieldStepData {
  txChain: string,
  extrinsicType: ExtrinsicType,
  extrinsic: SubmittableExtrinsic<'promise'> | TransactionConfig,
  txData: any,
  transferNativeAmount: string
}
