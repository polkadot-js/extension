// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicStatus, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { detectTranslate } from '@subwallet/extension-base/utils';
import { StatusType } from '@subwallet/extension-web-ui/Popup/Home/History/Detail';
import { CheckCircle, ClockCounterClockwise, PaperPlaneTilt, ProhibitInset, Queue, Spinner, StopCircle } from 'phosphor-react';

export const TxTypeNameMap: Record<ExtrinsicType, string> = {
  [ExtrinsicType.TRANSFER_BALANCE]: detectTranslate('Transfer'),
  [ExtrinsicType.TRANSFER_TOKEN]: detectTranslate('Transfer'),
  [ExtrinsicType.TRANSFER_XCM]: detectTranslate('Transfer'),
  [ExtrinsicType.SEND_NFT]: detectTranslate('NFT transaction'),
  [ExtrinsicType.CROWDLOAN]: detectTranslate('Crowdloan contribution'),
  [ExtrinsicType.STAKING_JOIN_POOL]: detectTranslate('Stake'),
  [ExtrinsicType.STAKING_BOND]: detectTranslate('Stake'),
  [ExtrinsicType.MINT_VDOT]: detectTranslate('Mint vDOT'),
  [ExtrinsicType.MINT_VMANTA]: detectTranslate('Mint vMANTA'),
  [ExtrinsicType.MINT_LDOT]: detectTranslate('Mint LDOT'),
  [ExtrinsicType.MINT_SDOT]: detectTranslate('Mint sDOT'),
  [ExtrinsicType.MINT_QDOT]: detectTranslate('Mint qDOT'),
  [ExtrinsicType.MINT_STDOT]: detectTranslate('Mint stDOT'),
  [ExtrinsicType.STAKING_LEAVE_POOL]: detectTranslate('Unstake'),
  [ExtrinsicType.STAKING_UNBOND]: detectTranslate('Unstake'),
  [ExtrinsicType.JOIN_YIELD_POOL]: detectTranslate('Join pool'),
  [ExtrinsicType.UNSTAKE_VDOT]: detectTranslate('Unstake vDOT'),
  [ExtrinsicType.UNSTAKE_VMANTA]: detectTranslate('Unstake vMANTA'),
  [ExtrinsicType.UNSTAKE_LDOT]: detectTranslate('Unstake LDOT'),
  [ExtrinsicType.UNSTAKE_SDOT]: detectTranslate('Unstake sDOT'),
  [ExtrinsicType.UNSTAKE_STDOT]: detectTranslate('Unstake stDOT'),
  [ExtrinsicType.UNSTAKE_QDOT]: detectTranslate('Unstake qDOT'),
  [ExtrinsicType.REDEEM_VDOT]: detectTranslate('Redeem vDOT'),
  [ExtrinsicType.REDEEM_VMANTA]: detectTranslate('Redeem vMANTA'),
  [ExtrinsicType.REDEEM_LDOT]: detectTranslate('Redeem LDOT'),
  [ExtrinsicType.REDEEM_SDOT]: detectTranslate('Redeem sDOT'),
  [ExtrinsicType.REDEEM_QDOT]: detectTranslate('Redeem qDOT'),
  [ExtrinsicType.REDEEM_STDOT]: detectTranslate('Redeem stDOT'),
  [ExtrinsicType.STAKING_WITHDRAW]: detectTranslate('Withdraw'),
  [ExtrinsicType.STAKING_COMPOUNDING]: detectTranslate('Stake compound'),
  [ExtrinsicType.STAKING_CLAIM_REWARD]: detectTranslate('Claim reward'),
  [ExtrinsicType.STAKING_CANCEL_UNSTAKE]: detectTranslate('Cancel unstake'),
  [ExtrinsicType.STAKING_POOL_WITHDRAW]: detectTranslate('Withdraw'),
  [ExtrinsicType.STAKING_CANCEL_COMPOUNDING]: detectTranslate('Cancel compound'),
  [ExtrinsicType.EVM_EXECUTE]: detectTranslate('EVM Execute'),
  [ExtrinsicType.TOKEN_SPENDING_APPROVAL]: detectTranslate('Token approve'),
  [ExtrinsicType.SWAP]: detectTranslate('Swap'),
  [ExtrinsicType.UNKNOWN]: detectTranslate('Unknown')
};

export const StakingTypeNameMap: Record<string, string> = {
  [ExtrinsicType.STAKING_JOIN_POOL]: detectTranslate('Stake'),
  [ExtrinsicType.STAKING_LEAVE_POOL]: detectTranslate('Unstake'),
  [ExtrinsicType.STAKING_BOND]: detectTranslate('Stake'),
  [ExtrinsicType.STAKING_UNBOND]: detectTranslate('Unstake'),
  [ExtrinsicType.STAKING_WITHDRAW]: detectTranslate('Withdraw'),
  [ExtrinsicType.STAKING_COMPOUNDING]: detectTranslate('Compounding')
};

export const HistoryStatusMap: Record<ExtrinsicStatus, StatusType> = {
  [ExtrinsicStatus.SUCCESS]: {
    schema: 'success',
    icon: CheckCircle,
    name: detectTranslate('Completed')
  },
  [ExtrinsicStatus.FAIL]: {
    schema: 'danger',
    icon: ProhibitInset,
    name: detectTranslate('Failed')
  },
  [ExtrinsicStatus.QUEUED]: {
    schema: 'light',
    icon: Queue,
    name: detectTranslate('Queued')
  },
  [ExtrinsicStatus.SUBMITTING]: {
    schema: 'gold',
    icon: PaperPlaneTilt,
    name: detectTranslate('Submitting')
  },
  [ExtrinsicStatus.PROCESSING]: {
    schema: 'gold',
    icon: Spinner,
    name: detectTranslate('Processing')
  },
  [ExtrinsicStatus.CANCELLED]: {
    schema: 'gray',
    icon: StopCircle,
    name: detectTranslate('Cancelled')
  },
  [ExtrinsicStatus.UNKNOWN]: {
    schema: 'gray',
    icon: StopCircle,
    name: detectTranslate('Unknown')
  },
  [ExtrinsicStatus.TIMEOUT]: {
    schema: 'gold',
    icon: ClockCounterClockwise,
    name: detectTranslate('Time-out')
  }
};
