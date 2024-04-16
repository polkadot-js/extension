// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
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

export const isTypeMint = (txType: ExtrinsicType) =>
  [
    ExtrinsicType.MINT_LDOT,
    ExtrinsicType.MINT_QDOT,
    ExtrinsicType.MINT_SDOT,
    ExtrinsicType.MINT_VDOT,
    ExtrinsicType.MINT_VMANTA,
    ExtrinsicType.MINT_STDOT
  ].includes(txType);

export const isPoolLeave = (txType: ExtrinsicType) =>
  [
    ExtrinsicType.REDEEM_LDOT,
    ExtrinsicType.REDEEM_QDOT,
    ExtrinsicType.REDEEM_SDOT,
    ExtrinsicType.REDEEM_STDOT,
    ExtrinsicType.REDEEM_VDOT,
    ExtrinsicType.REDEEM_VMANTA,
    ExtrinsicType.UNSTAKE_LDOT,
    ExtrinsicType.UNSTAKE_QDOT,
    ExtrinsicType.UNSTAKE_SDOT,
    ExtrinsicType.UNSTAKE_STDOT,
    ExtrinsicType.UNSTAKE_VDOT,
    ExtrinsicType.UNSTAKE_VMANTA
  ].includes(txType);
