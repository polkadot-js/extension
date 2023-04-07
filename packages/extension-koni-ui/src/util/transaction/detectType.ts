// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';

export const isTypeTransfer = (txType: ExtrinsicType) => [
  ExtrinsicType.TRANSFER_BALANCE,
  ExtrinsicType.TRANSFER_TOKEN,
  ExtrinsicType.TRANSFER_XCM
].includes(txType);

export const isTypeStaking = (txType: ExtrinsicType) => [
  ExtrinsicType.STAKING_JOIN_POOL,
  ExtrinsicType.STAKING_LEAVE_POOL,
  ExtrinsicType.STAKING_BOND,
  ExtrinsicType.STAKING_UNBOND,
  ExtrinsicType.STAKING_WITHDRAW,
  ExtrinsicType.STAKING_COMPOUNDING,
  ExtrinsicType.STAKING_CANCEL_UNSTAKE
].includes(txType);
