// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson, ParseEVMTransactionData, ResponseParseEVMTransactionInput } from '@subwallet/extension-base/background/KoniTypes';
import { ERC20Contract, ERC721Contract } from '@subwallet/extension-koni-base/api/web3/web3';
import { InputDataDecoder } from '@subwallet/extension-koni-base/utils/eth/parseTransactionData';

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const ABIs = [ERC20Contract.abi, ERC721Contract];

export const parseTransactionData = (input: string, network?: NetworkJson): ResponseParseEVMTransactionInput => {

  let result: ParseEVMTransactionData | string = input;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const _ABIs: any[] = [...ABIs];

  for (const abi of _ABIs) {
    const decoder = new InputDataDecoder(abi);
    const raw = decoder.decodeData(input);

    if (raw.method) {
      const temp: ParseEVMTransactionData = {
        method: raw.method,
        args: []
      };

      raw.types.forEach((type, index) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        temp.args.push({ type: type, value: raw.inputs[index].toString(), name: raw.names[index].toString() });
      });

      result = temp;
      break;
    }
  }

  return {
    result
  };
};
