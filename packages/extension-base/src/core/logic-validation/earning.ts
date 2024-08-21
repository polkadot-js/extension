// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import BigN from 'bignumber.js';

export function _handleDisplayForEarningError (error: TransactionError) {
  if (
    error.message.startsWith('UnknownError Connection to Indexed DataBase server lost') ||
    error.message.startsWith('Provided address is invalid, the capitalization checksum test failed') ||
    error.message.startsWith('connection not open on send()')) {
    return {
      title: 'Connection error',
      message: 'Your selected network has lost connection. Update it by re-enabling it or changing network provider'
    };
  }

  return undefined;
}

export const INSUFFICIENT_MESSAGES = ['残高不足', 'Недостаточный баланс', 'Insufficient balance'];

export function _handleDisplayInsufficientEarningError (error: Error, isXCM: boolean, availableBalance: string, amount: string, minJoinPool: string) {
  if (isXCM || !INSUFFICIENT_MESSAGES.some((v) => error.message.includes(v))) {
    return undefined;
  }

  const bnAvailableBalance = new BigN(availableBalance);
  const bnAmount = new BigN(amount);

  if (bnAvailableBalance.gt(0) && bnAmount.gte(bnAvailableBalance)) {
    return {
      title: 'Insufficient balance',
      message: 'Insufficient balance. Amount must be smaller than available balance'
    };
  }

  if (bnAvailableBalance.lte(minJoinPool)) {
    return {
      title: 'Insufficient balance',
      message: 'You don\'t have enough {{symbol}} ({{chain}}) to stake, make sure your available balance is higher than {{minJoinPool}} {{symbol}}'
    };
  }

  return {
    title: 'Insufficient balance',
    message: 'You don\'t have enough {{symbol}} ({{chain}}) to pay gas fee. Lower your amount and try again'
  };
}
