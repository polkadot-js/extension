// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { GAS_PRICE_RATIO, NETWORK_MULTI_GAS_FEE } from '@subwallet/extension-base/constants';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import BigN from 'bignumber.js';
import BNEther from 'bn.js';
import { ethers } from 'ethers';
import { SignedTransaction } from 'web3-core';

import { hexStripPrefix, numberToHex } from '@polkadot/util';

import { BN_ONE, BN_ZERO } from './number';

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
    const rewardPercent: number[] = [];

    for (let i = 0; i <= 100; i = i + 5) {
      rewardPercent.push(i);
    }

    const history = await web3.api.eth.getFeeHistory(numBlock, 'latest', rewardPercent);

    const baseGasFee = new BigN(history.baseFeePerGas[history.baseFeePerGas.length - 1]); // Last element is latest

    const blocksBusy = history.reward.reduce((previous: number, rewards, currentIndex) => {
      const [priority] = rewards;
      const base = history.baseFeePerGas[currentIndex];

      const priorityBN = new BigN(priority);
      const baseBN = new BigN(base);

      /*
      * True if priority >= 0.3 * base
      *  */
      const blockIsBusy = baseBN.gt(BN_ZERO)
        ? (priorityBN.dividedBy(baseBN).gte(0.3) ? 1 : 0)
        : 0; // Special for bsc, base fee = 0

      return previous + blockIsBusy;
    }, 0);

    const busyNetwork = blocksBusy >= (numBlock / 2); // True, if half of block is busy

    const rawMaxPriorityFeePerGas = history.reward.reduce((previous, rewards) => {
      let firstBN = BN_ZERO;
      let firstIndex = 0;

      for (let i = 0; i < rewards.length; i++) {
        firstIndex = i;
        const current = rewards[i];
        const currentBN = new BigN(current);

        if (currentBN.gt(BN_ZERO)) {
          firstBN = currentBN;

          break;
        }
      }

      let secondBN = firstBN;

      for (let i = firstIndex; i < rewards.length; i++) {
        const current = rewards[i];
        const currentBN = new BigN(current);

        if (currentBN.gt(firstBN)) {
          secondBN = currentBN;

          break;
        }
      }

      let current: BigN;

      if (firstBN.eq(BN_ZERO)) {
        current = secondBN;

        return current.gte(previous) ? current : previous; // get min priority
      } else if (busyNetwork) {
        current = secondBN.dividedBy(2).gte(firstBN) ? firstBN : secondBN; // second too larger than first (> 2 times), use first else use second
      } else {
        current = firstBN;
      }

      if (busyNetwork) {
        return current.gte(previous) ? current : previous; // get max priority
      } else {
        if (previous.eq(BN_ZERO)) {
          return current; // get min priority
        } else if (current.eq(BN_ZERO)) {
          return previous;
        }

        return current.lte(previous) ? current : previous; // get min priority
      }
    }, BN_ZERO);

    const maxPriorityFeePerGas = rawMaxPriorityFeePerGas.gte(BN_ONE) ? rawMaxPriorityFeePerGas : BN_ONE;

    /* Max gas = (base + priority) * 1.5 (if not busy or 2 when busy); */
    const maxFeePerGas = baseGasFee.plus(maxPriorityFeePerGas).multipliedBy(busyNetwork ? 2 : 1.5).decimalPlaces(0);

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
