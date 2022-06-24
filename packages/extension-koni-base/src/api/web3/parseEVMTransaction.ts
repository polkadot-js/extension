// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ParseEVMTransactionData, ResponseParseTransactionEVM } from '@subwallet/extension-base/background/KoniTypes';
import { ERC20Contract, ERC721Contract } from '@subwallet/extension-koni-base/api/web3/web3';
import { createTransactionFromRLP, Transaction as QrTransaction } from '@subwallet/extension-koni-base/utils/eth';
import BigN from 'bignumber.js';
import InputDataDecoder from 'ethereum-input-data-decoder';

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const ABIs = [ERC20Contract.abi, ERC721Contract];

export const parseEVMTransaction = (data: string): ResponseParseTransactionEVM => {
  const tx: QrTransaction | null = createTransactionFromRLP(data);

  if (!tx) {
    throw new Error(`Cannot create tx from ${data}`);
  }

  const result: ResponseParseTransactionEVM = {
    data: tx.data,
    gasPrice: new BigN(tx.gasPrice).toNumber(),
    gas: new BigN(tx.gas).toNumber(),
    to: tx.action,
    value: new BigN(tx.value).toNumber(),
    nonce: new BigN(tx.nonce).toNumber()
  };

  for (const abi of ABIs) {
    const decoder = new InputDataDecoder(abi);
    const raw = decoder.decodeData(tx.data);

    if (raw.method) {
      const temp: ParseEVMTransactionData = {
        method: raw.method,
        args: []
      };

      raw.types.forEach((type, index) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        temp.args.push({ type: type, value: raw.inputs[index].toString(), name: raw.names[index].toString() });
      });

      result.data = temp;
    }
  }

  return result;
};
