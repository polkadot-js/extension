// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicStatus, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { StatusType } from '@subwallet/extension-koni-ui/Popup/Home/History/Detail';
import { CheckCircle, PaperPlaneTilt, ProhibitInset, Queue, Spinner, StopCircle } from 'phosphor-react';

export const TxTypeNameMap: Record<string, string> = {
  [ExtrinsicType.TRANSFER_BALANCE]: 'Transfer',
  [ExtrinsicType.TRANSFER_TOKEN]: 'Transfer',
  [ExtrinsicType.TRANSFER_XCM]: 'Transfer',
  [ExtrinsicType.SEND_NFT]: 'NFT',
  [ExtrinsicType.CROWDLOAN]: 'Crowdloan',
  [ExtrinsicType.STAKING_JOIN_POOL]: 'Stake',
  [ExtrinsicType.STAKING_LEAVE_POOL]: 'Unstake',
  [ExtrinsicType.STAKING_BOND]: 'Bond',
  [ExtrinsicType.STAKING_UNBOND]: 'Unbond',
  [ExtrinsicType.STAKING_CLAIM_REWARD]: 'Claim reward',
  [ExtrinsicType.STAKING_WITHDRAW]: 'Withdraw',
  [ExtrinsicType.STAKING_CANCEL_UNSTAKE]: 'Cancel unstake',
  [ExtrinsicType.STAKING_COMPOUNDING]: 'Compounding',
  [ExtrinsicType.EVM_EXECUTE]: 'EVM Execute'
};

export const StakingTypeNameMap: Record<string, string> = {
  [ExtrinsicType.STAKING_JOIN_POOL]: 'Stake',
  [ExtrinsicType.STAKING_LEAVE_POOL]: 'Unstake',
  [ExtrinsicType.STAKING_BOND]: 'Bond',
  [ExtrinsicType.STAKING_UNBOND]: 'Unbond',
  [ExtrinsicType.STAKING_WITHDRAW]: 'Withdraw',
  [ExtrinsicType.STAKING_COMPOUNDING]: 'Compounding'
};

export const HistoryStatusMap: Record<ExtrinsicStatus, StatusType> = {
  [ExtrinsicStatus.SUCCESS]: {
    schema: 'success',
    icon: CheckCircle,
    name: 'Completed'
  },
  [ExtrinsicStatus.FAIL]: {
    schema: 'danger',
    icon: ProhibitInset,
    name: 'Failed'
  },
  [ExtrinsicStatus.QUEUED]: {
    schema: 'light',
    icon: Queue,
    name: 'Queued'
  },
  [ExtrinsicStatus.SUBMITTING]: {
    schema: 'gold',
    icon: PaperPlaneTilt,
    name: 'Submitting'
  },
  [ExtrinsicStatus.PROCESSING]: {
    schema: 'gold',
    icon: Spinner,
    name: 'Processing'
  },
  [ExtrinsicStatus.CANCELLED]: {
    schema: 'gray',
    icon: StopCircle,
    name: 'Cancelled'
  },
  [ExtrinsicStatus.UNKNOWN]: {
    schema: 'danger',
    icon: StopCircle,
    name: 'Unknown'
  }
};
