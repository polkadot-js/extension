// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { GAS_PRICE_RATIO, NETWORK_MULTI_GAS_FEE } from '@subwallet/extension-base/constants';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import { EvmFeeInfo, EvmFeeInfoCache, InfuraFeeInfo } from '@subwallet/extension-base/types';
import { BN_WEI, BN_ZERO } from '@subwallet/extension-base/utils';
import BigN from 'bignumber.js';

const INFURA_API_KEY = process.env.INFURA_API_KEY || '';
const INFURA_API_KEY_SECRET = process.env.INFURA_API_KEY_SECRET || '';
const INFURA_AUTH = 'Basic ' + Buffer.from(INFURA_API_KEY + ':' + INFURA_API_KEY_SECRET).toString('base64');

export const parseInfuraFee = (info: InfuraFeeInfo): EvmFeeInfo => {
  const base = new BigN(info.estimatedBaseFee).multipliedBy(BN_WEI);
  const low = new BigN(info.low.suggestedMaxPriorityFeePerGas).multipliedBy(BN_WEI);
  const busyNetwork = base.gt(BN_ZERO) ? low.dividedBy(base).gte(0.3) : false;
  const data = !busyNetwork ? info.low : info.medium;

  return {
    busyNetwork,
    gasPrice: undefined,
    baseGasFee: base,
    maxFeePerGas: new BigN(data.suggestedMaxFeePerGas).multipliedBy(BN_WEI).integerValue(BigN.ROUND_UP),
    maxPriorityFeePerGas: new BigN(data.suggestedMaxPriorityFeePerGas).multipliedBy(BN_WEI).integerValue(BigN.ROUND_UP)
  };
};

export const fetchInfuraFeeData = async (chainId: number, infuraAuth?: string): Promise<EvmFeeInfo | null> => {
  return await new Promise<EvmFeeInfo | null>((resolve) => {
    const baseUrl = 'https://gas.api.infura.io/networks/{{chainId}}/suggestedGasFees';
    const url = baseUrl.replaceAll('{{chainId}}', chainId.toString());

    fetch(url,
      {
        method: 'GET',
        headers: {
          Authorization: infuraAuth || INFURA_AUTH
        }
      })
      .then((rs) => {
        return rs.json();
      })
      .then((info: InfuraFeeInfo) => {
        resolve(parseInfuraFee(info));
      })
      .catch((e) => {
        console.warn(e);
        resolve(null);
      });
  });
};

export const fetchSubWalletFeeData = async (chainId: number, networkKey: string): Promise<EvmFeeInfo | null> => {
  return await new Promise<EvmFeeInfo | null>((resolve) => {
    const baseUrl = 'https://gas.api.infura.io/networks/{{chain}}/suggestedGasFees';
    const url = baseUrl.replaceAll('{{chain}}', networkKey);

    fetch(url,
      {
        method: 'GET'
      })
      .then((rs) => {
        return rs.json();
      })
      .then((info: EvmFeeInfoCache) => {
        if (info.gasPrice !== undefined) {
          resolve(info);
        } else {
          resolve({
            busyNetwork: info.busyNetwork,
            gasPrice: info.gasPrice,
            baseGasFee: new BigN(info.baseGasFee),
            maxFeePerGas: new BigN(info.maxFeePerGas),
            maxPriorityFeePerGas: new BigN(info.maxPriorityFeePerGas)
          });
        }
      })
      .catch((e) => {
        console.warn(e);
        resolve(null);
      });
  });
};

export const fetchOnlineFeeData = async (chainId: number, networkKey: string, useInfura = false): Promise<EvmFeeInfo | null> => {
  return await new Promise<EvmFeeInfo | null>((resolve) => {
    const fetchFunction = useInfura ? fetchInfuraFeeData : fetchSubWalletFeeData;

    fetchFunction(chainId, networkKey)
      .then((info) => {
        resolve(info);
      })
      .catch((e) => {
        console.warn(e);
        resolve(null);
      });
  });
};

export const recalculateGasPrice = (_price: string, chain: string) => {
  const needMulti = NETWORK_MULTI_GAS_FEE.includes(chain) || NETWORK_MULTI_GAS_FEE.includes('*');

  return needMulti ? new BigN(_price).multipliedBy(GAS_PRICE_RATIO).toFixed(0) : _price;
};

export const calculateGasFeeParams = async (web3: _EvmApi, networkKey: string, useOnline = true, useInfura = true): Promise<EvmFeeInfo> => {
  if (useOnline) {
    try {
      const chainId = await web3.api.eth.getChainId();
      const onlineData = await fetchOnlineFeeData(chainId, networkKey, useInfura);

      if (onlineData) {
        return onlineData;
      }
    } catch (e) {

    }
  }

  try {
    const numBlock = 20;
    const rewardPercent: number[] = [];

    for (let i = 0; i <= 100; i = i + 5) {
      rewardPercent.push(i);
    }

    const history = await web3.api.eth.getFeeHistory(numBlock, 'latest', rewardPercent);

    const baseGasFee = new BigN(history.baseFeePerGas[history.baseFeePerGas.length - 1]); // Last element is latest

    const blocksBusy = history.reward.reduce((previous: number, rewards, currentIndex) => {
      const [firstPriority] = rewards;
      const base = history.baseFeePerGas[currentIndex];

      const priorityBN = new BigN(firstPriority);
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

    const maxPriorityFeePerGas = history.reward.reduce((previous, rewards) => {
      let firstBN = BN_ZERO;
      let firstIndex = 0;

      /* Get first priority which greater than 0 */
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

      /* Get second priority which greater than first priority */
      for (let i = firstIndex; i < rewards.length; i++) {
        const current = rewards[i];
        const currentBN = new BigN(current);

        if (currentBN.gt(firstBN)) {
          secondBN = currentBN;

          break;
        }
      }

      let current: BigN;

      if (busyNetwork) {
        current = secondBN.dividedBy(2).gte(firstBN) ? firstBN : secondBN; // second too larger than first (> 2 times), use first else use second
      } else {
        current = firstBN;
      }

      if (busyNetwork) {
        /* Get max value */
        return current.gte(previous) ? current : previous; // get max priority
      } else {
        /* Get min value which greater than 0 */
        if (previous.eq(BN_ZERO)) {
          return current; // get min priority
        } else if (current.eq(BN_ZERO)) {
          return previous;
        }

        return current.lte(previous) ? current : previous; // get min priority
      }
    }, BN_ZERO);

    if (maxPriorityFeePerGas.eq(BN_ZERO)) {
      const _price = await web3.api.eth.getGasPrice();
      const gasPrice = recalculateGasPrice(_price, networkKey);

      return {
        gasPrice,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        baseGasFee: undefined,
        busyNetwork: false
      };
    }

    /* Max gas = (base + priority) * 1.5 (if not busy or 2 when busy); */
    const maxFeePerGas = baseGasFee.plus(maxPriorityFeePerGas).multipliedBy(busyNetwork ? 2 : 1.5).decimalPlaces(0);

    return {
      gasPrice: undefined,
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
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
      baseGasFee: undefined,
      busyNetwork: false
    };
  }
};
