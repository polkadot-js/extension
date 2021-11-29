/* eslint-disable camelcase */

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { DeriveStakingQuery } from '@polkadot/api-derive/types';

export interface TransactionStatus {
  blockNumber: string | null;
  success: boolean | null;
  text: string | null;
}

export interface BalanceType {
  coin: string,
  available: bigint,
  total: bigint,
  reserved?: bigint,
  miscFrozen?: bigint,
  feeFrozen?: bigint,
  decimals: number
}

export const DEFAULT_ACCOUNT_BALANCE = { address: null, balanceInfo: null, chain: null, name: null };

export interface AccountsBalanceType {
  address: string | null;
  chain: string | null;// TODO: actually it is chainName
  balanceInfo?: BalanceType;
  name: string | null;
  txHistory?: string;
}

export interface transactionHistory {
  amount: string;
  coin: string;
  hash: string;
  fee: string;
  to: string;
  status: string;
}

export interface StakingConsts {
  existentialDeposit: bigint,
  maxNominations: number,
  maxNominatorRewardedPerValidator: number,
  minNominatorBond: number,
  bondingDuration: number
}

export interface Validators {
  current: DeriveStakingQuery[],
  waiting: DeriveStakingQuery[],
  // currentEraIndex: number
}

export interface AllValidatorsFromSubscan {
  current: ValidatorsFromSubscan[],
  waiting: ValidatorsFromSubscan[]
}

export interface ValidatorsName {
  address: string;
  name: string;
}

export interface savedMetaData { chainName: string; metaData: any }

export interface ValidatorsFromSubscan {
  bonded_nominators: string;
  bonded_owner: string;
  bonded_total?: string;
  controller_account_display?: stashAccountDisplay;
  count_nominators: number;
  grandpa_vote?: number;
  latest_mining?: number;
  node_name: string;
  rank_validator?: number;
  reward_account: string;
  reward_point?: number;
  reward_pot_balance: string;
  session_key?: any;
  stash_account_display: stashAccountDisplay;
  validator_prefs_value: number;
}

interface stashAccountDisplay {
  account_index: string;
  address: string;
  display: string;
  identity: boolean;
  judgements: any;
  parent: any;
}
