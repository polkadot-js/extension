// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EVMTransactionArg, NestedArray, NetworkJson, ParseEVMTransactionData, ResponseParseEVMContractInput, ResponseQrParseRLP } from '@subwallet/extension-base/background/KoniTypes';
import { ERC20Contract, ERC721Contract, initWeb3Api } from '@subwallet/extension-koni-base/api/tokens/evm/web3';
import { createTransactionFromRLP, Transaction as QrTransaction } from '@subwallet/extension-koni-base/utils/eth';
import { InputDataDecoder } from '@subwallet/extension-koni-base/utils/eth/parseTransactionData';
import axios from 'axios';
import BigN from 'bignumber.js';

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const ABIs = [ERC20Contract.abi, ERC721Contract];

const genName = (name: NestedArray<string>): string => {
  if (typeof name === 'string') {
    return name;
  } else {
    if (Array.isArray(name[1])) {
      const _name = name[0] as string;
      const children = genName(name[1]);

      return `${_name}(${children})`;
    } else {
      return name.join(', ');
    }
  }
};

const genInput = (input: NestedArray<any>): string => {
  if (Array.isArray(input)) {
    const arr: string[] = input.map(genInput);

    return `[${arr.join(', ')}]`;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
    return input.toString();
  }
};

const parseType = (_types: string): NestedArray<string> => {
  const types = _types.trim();

  if (types.indexOf('(') !== 0) {
    if (!types.includes(',')) {
      return types.trim();
    } else {
      const arr: string[] = [];
      let s = types;

      do {
        if (s.indexOf('(') === 0) {
          const start = s.indexOf('(');
          const end = s.lastIndexOf(')');
          const _new = s.slice(start, end + 1);

          arr.push(_new);
          s = s.replace(_new, '');
        } else {
          const start = s.indexOf(',');

          if (start !== -1) {
            const str = s.slice(0, start);

            arr.push(str);
            s = s.slice(start + 1).trim();
          } else {
            arr.push(s);
            s = '';
          }
        }
      } while (s.length);

      return arr.map((s) => s.trim());
    }
  } else {
    const start = types.indexOf('(');
    const end = types.lastIndexOf(')');
    const _new = types.slice(start + 1, end);

    return parseType(_new);
  }
};

const parseResult = (type: string, input: NestedArray<any>, name: NestedArray<string>): EVMTransactionArg => {
  const types = parseType(type);

  if (Array.isArray(types)) {
    const inputs = input as NestedArray<any>[];
    const _name = (name as NestedArray<string>[])[0] as string;
    const names = (name as NestedArray<string>[])[1];
    const children: EVMTransactionArg[] = [];

    types.forEach((type, index) => {
      children.push(parseResult(type as string, inputs[index], names[index]));
    });

    return {
      type: type,
      name: _name,
      value: genInput(input),
      children: children
    };
  } else {
    return {
      type: types,
      name: genName(name),
      value: genInput(input)
    };
  }
};

const isContractAddress = async (address: string, network: NetworkJson): Promise<boolean> => {
  const provider = network.currentProvider && network.providers[network.currentProvider];

  if (!provider) {
    return false;
  } else {
    const web3 = initWeb3Api(provider);
    const code = await web3.eth.getCode(address);

    return code !== '0x';
  }
};

export const parseContractInput = async (input: string, contractAddress: string, network: NetworkJson | null): Promise<ResponseParseEVMContractInput> => {
  let result: ParseEVMTransactionData | string = input;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const _ABIs: any[] = [...ABIs];

  if (contractAddress) {
    if (network?.abiExplorer) {
      const res = await axios.get(network?.abiExplorer, {
        params: {
          address: contractAddress
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (res.status === 200 && res.data.status === '1') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        _ABIs.unshift(res.data.result);
      }
    }
  }

  for (const abi of _ABIs) {
    const decoder = new InputDataDecoder(abi);
    const raw = decoder.decodeData(input);

    if (raw.method && raw.methodName) {
      const temp: ParseEVMTransactionData = {
        method: raw.method,
        methodName: raw.methodName,
        args: []
      };

      raw.types.forEach((type, index) => {
        temp.args.push(parseResult(type, raw.inputs[index], raw.names[index]));
      });

      result = temp;
      break;
    }
  }

  return {
    result
  };
};

const getNetworkJsonByChainId = (networkMap: Record<string, NetworkJson>, chainId: number): NetworkJson | null => {
  if (!chainId) {
    for (const n in networkMap) {
      if (!Object.prototype.hasOwnProperty.call(networkMap, n)) {
        continue;
      }

      const networkInfo = networkMap[n];

      if (networkInfo.isEthereum) {
        return networkInfo;
      }
    }

    return null;
  }

  for (const n in networkMap) {
    if (!Object.prototype.hasOwnProperty.call(networkMap, n)) {
      continue;
    }

    const networkInfo = networkMap[n];

    if (networkInfo.evmChainId === chainId) {
      return networkInfo;
    }
  }

  return null;
};

export const parseEvmRlp = async (data: string, networkMap: Record<string, NetworkJson>): Promise<ResponseQrParseRLP> => {
  const tx: QrTransaction | null = createTransactionFromRLP(data);

  if (!tx) {
    throw new Error(`Cannot create tx from ${data}`);
  }

  const result: ResponseQrParseRLP = {
    input: tx.data,
    data: tx.data,
    gasPrice: new BigN(tx.gasPrice).toNumber(),
    gas: new BigN(tx.gas).toNumber(),
    to: tx.action,
    value: new BigN(tx.value).toNumber(),
    nonce: new BigN(tx.nonce).toNumber()
  };

  const network: NetworkJson | null = getNetworkJsonByChainId(networkMap, parseInt(tx.ethereumChainId));

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const _ABIs: any[] = [...ABIs];

  if (tx.action && network) {
    if (await isContractAddress(tx.action, network)) {
      if (network?.abiExplorer) {
        const res = await axios.get(network?.abiExplorer, {
          params: {
            address: tx.action
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (res.status === 200 && res.data.status === '1') {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          _ABIs.unshift(res.data.result);
        }
      }
    }
  }

  for (const abi of _ABIs) {
    const decoder = new InputDataDecoder(abi);
    const raw = decoder.decodeData(tx.data);

    if (raw.method && raw.methodName) {
      const temp: ParseEVMTransactionData = {
        method: raw.method,
        methodName: raw.methodName,
        args: []
      };

      raw.types.forEach((type, index) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        temp.args.push(parseResult(type, raw.inputs[index], raw.names[index]));
      });

      result.data = temp;
      break;
    }
  }

  return result;
};
