// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { GAS_PRICE_RATIO, NETWORK_MULTI_GAS_FEE } from '@subwallet/extension-base/constants';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import BigN from 'bignumber.js';
import BNEther from 'bn.js';
import { ethers } from 'ethers';
import { SignedTransaction } from 'web3-core';

import { hexStripPrefix, numberToHex } from '@polkadot/util';

import { BN_ZERO } from './number';

const hexToNumberString = (s: string): string => {
  const temp = parseInt(s, 16);

  if (isNaN(temp)) {
    return '0';
  } else {
    return temp.toString();
  }
};

export class Transaction {
  readonly nonce: string;
  readonly gasPrice: string;
  readonly gas: string;
  readonly to: string;
  readonly value: string;
  readonly data: string;
  readonly ethereumChainId: string;
  readonly isSafe: boolean;

  constructor (nonce: string,
    gasPrice: string,
    gas: string,
    to: string,
    value: string,
    data: string,
    ethereumChainId: string) {
    this.nonce = hexToNumberString(nonce);
    this.gasPrice = hexToNumberString(gasPrice);
    this.gas = hexToNumberString(gas);
    this.to = to;
    this.value = hexToNumberString(value);
    this.data = data || '';
    this.ethereumChainId = parseInt(ethereumChainId, 16).toString();
    this.isSafe = true;
  }
}

export const anyNumberToBN = (value?: string | number | BNEther): BigN => {
  if (typeof value === 'string' || typeof value === 'number') {
    return new BigN(value);
  } else if (typeof value === 'undefined') {
    return new BigN(0);
  } else {
    return new BigN(value.toNumber());
  }
};

export const createTransactionFromRLP = (rlp: string): Transaction | null => {
  try {
    const transaction = ethers.Transaction.from(rlp);
    const nonce = transaction.nonce.toString(16);
    const gasPrice = transaction.gasPrice?.toString(16) || '';
    const gas = transaction.gasLimit.toString(16);
    const to = transaction.to || '';
    const value = transaction.value.toString(16);
    const data = transaction.data;
    const ethereumChainId = transaction.chainId.toString(16);

    return new Transaction(nonce,
      gasPrice,
      gas,
      to,
      value,
      data,
      ethereumChainId);
  } catch (e) {
    console.log((e as Error).message);

    return null;
  }
};

export const signatureToHex = (sig: SignedTransaction): string => {
  const v = parseInt(sig.v);
  const r = hexStripPrefix(sig.r);
  const s = hexStripPrefix(sig.s);
  const hexR = r.length % 2 === 1 ? `0${r}` : r;
  const hexS = s.length % 2 === 1 ? `0${s}` : s;
  const hexV = hexStripPrefix(numberToHex(v));

  return hexR + hexS + hexV;
};

export const recalculateGasPrice = (_price: string, chain: string) => {
  const needMulti = NETWORK_MULTI_GAS_FEE.includes(chain) || NETWORK_MULTI_GAS_FEE.includes('*');

  return needMulti ? new BigN(_price).multipliedBy(GAS_PRICE_RATIO).toFixed(0) : _price;
};

export const calculateGasFeeParams = async (web3: _EvmApi, networkKey: string) => {
  try {
    const numBlock = 20;
    const history = await web3.api.eth.getFeeHistory(numBlock, 'latest', [0, 25, 50, 75, 100]);

    const baseGasFee = new BigN(history.baseFeePerGas[history.baseFeePerGas.length - 1]); // Last element is latest

    const blocksBusy = history.reward.reduce((previous: number, rewards, currentIndex) => {
      const [priority] = rewards;
      const base = history.baseFeePerGas[currentIndex];

      const priorityBN = new BigN(priority);
      const baseBN = new BigN(base);

      const blockIsBusy = (priorityBN.dividedBy(baseBN).gte(0.3) ? 1 : 0); // True if priority >= 0.5 * base

      return previous + blockIsBusy;
    }, 0);

    const busyNetwork = blocksBusy >= (numBlock / 2); // True if half of block is busy

    const maxPriorityFeePerGas = history.reward.reduce((previous, rewards) => {
      const [first, second] = rewards;
      const firstBN = new BigN(first);
      const secondBN = new BigN(second);

      if (busyNetwork) {
        const current = secondBN.dividedBy(2).gte(firstBN) ? firstBN : secondBN; // second too larger than first (> 2 times), use first else use second

        return current.gte(previous) ? current : previous; // get max priority
      } else {
        const current = firstBN;

        return current.lte(previous) ? current : previous; // get min priority
      }
    }, BN_ZERO);

    const maxFeePerGas = baseGasFee.plus(maxPriorityFeePerGas).multipliedBy(busyNetwork ? 2 : 1.5).decimalPlaces(0); // Max gas =(base + priority) * 1.5(if not busy or 2 when busy);

    return {
      maxFeePerGas,
      maxPriorityFeePerGas,
      baseGasFee,
      busyNetwork
    };
  } catch (e) {
    const _price = await web3.api.eth.getGasPrice();
    const gasPrice = recalculateGasPrice(_price, networkKey);

    return {
      gasPrice,
      busyNetwork: false
    };
  }
};
