
// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import type { SettingsStruct } from '@polkadot/ui-settings/types';

import { Chain } from '@polkadot/extension-chains/types';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

// eslint-disable-next-line header/header
export const FLOATING_POINT_DIGIT = 4;
export const DEFAULT_TOKEN_DECIMALS = 12;
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const DEFAULT_COIN = 'WND';

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

// interface BalanceType {
//   coin: string, availableBalance: string, balance: string, reserved: string, miscFrozen: string, feeFrozen: string
// }

export const DEFAULT_ACCOUNT_BALANCE = { address: null, balanceInfo: null, chain: null, name: null };

export interface accountsBalanceType {
  address: string | null;
  chain: Chain | null;
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

export function fixFloatingPoint (_number: number | string): string {
  const sNumber = String(_number);
  const dotIndex = sNumber.indexOf('.');

  if (dotIndex < 0) return sNumber;

  return sNumber.slice(0, dotIndex) + sNumber.slice(dotIndex, dotIndex + FLOATING_POINT_DIGIT + 1);
}

export function balanceToHuman (_balance: accountsBalanceType | null, _type: string): string {
  if (!_balance || !_balance.balanceInfo) return '';

  const balance = _balance.balanceInfo;
  const x = 10 ** balance.decimals;

  switch (_type) {
    case 'total':
      return fixFloatingPoint(Number(balance.total) / x);
    case 'available':
      return fixFloatingPoint(Number(balance.available) / x);
    default:
      console.log('_type in unknown in balanceToHuman!');

      return '';
  }
}

export function amountToHuman (_amount: string | undefined, _decimals: number): string {
  if (!_amount) return '';

  const x = 10 ** _decimals;

  return fixFloatingPoint(Number(_amount) / x);
}

export function amountToMachine (_amount: string | undefined, _decimals: number): bigint {
  if (!_amount) return BigInt(0);

  const dotIndex = _amount.indexOf('.');

  if (dotIndex > 0) {
    const decimalsOfAmount = _amount.length - dotIndex - 1;

    _amount = _amount.slice(0, dotIndex) + _amount.slice(dotIndex + 1, _amount.length);
    _decimals -= decimalsOfAmount;
    if (_decimals < 0) throw new Error("_decimals should be more than _amount's decimals digits");
  }

  const x = 10 ** _decimals;

  return BigInt(_amount) * BigInt(x);
}

export function getFormattedAddress (_address: string | null | undefined, _chain: Chain | null | undefined, settings: SettingsStruct): string {
  const publicKey = decodeAddress(_address);
  const prefix = _chain ? _chain.ss58Format : (settings.prefix === -1 ? 42 : settings.prefix);

  return encodeAddress(publicKey, prefix);
}

export function handleAccountBalance (balance: any): { available: bigint, feeFrozen: bigint, miscFrozen: bigint, reserved: bigint, total: bigint } {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    available: BigInt(String(balance.free)) - BigInt(String(balance.miscFrozen)),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    feeFrozen: BigInt(String(balance.feeFrozen)),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    miscFrozen: BigInt(String(balance.miscFrozen)),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    reserved: BigInt(String(balance.reserved)),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    total: BigInt(String(balance.free)) + BigInt(String(balance.reserved))
  };
}
