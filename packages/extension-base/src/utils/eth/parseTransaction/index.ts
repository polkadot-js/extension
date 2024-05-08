// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { EvmTransactionArg, NestedArray, ParseEvmTransactionData, ResponseParseEvmContractInput, ResponseQrParseRLP } from '@subwallet/extension-base/background/KoniTypes';
import { _ERC20_ABI, _ERC721_ABI } from '@subwallet/extension-base/services/chain-service/helper';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getEvmAbiExplorer, _getEvmChainId, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { createTransactionFromRLP, Transaction as QrTransaction } from '@subwallet/extension-base/utils/eth';
import { InputDataDecoder } from '@subwallet/extension-base/utils/eth/parseTransaction/base';
import axios from 'axios';
import BigN from 'bignumber.js';
import { t } from 'i18next';

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const ABIs = [_ERC20_ABI, _ERC721_ABI];

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

const parseResult = (type: string, input: NestedArray<any>, name: NestedArray<string>): EvmTransactionArg => {
  const types = parseType(type);

  if (Array.isArray(types)) {
    const inputs = input as NestedArray<any>[];
    const _name = (name as NestedArray<string>[])[0] as string;
    const names = (name as NestedArray<string>[])[1];
    const children: EvmTransactionArg[] = [];

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
      name: genName(name),
      type: types,
      value: genInput(input)
    };
  }
};

export const isContractAddress = async (address: string, evmApi: _EvmApi): Promise<boolean> => {
  if (!evmApi || !address) {
    return false;
  } else {
    const code = await evmApi.api.eth.getCode(address);

    return code !== '0x';
  }
};

const parseInputWithAbi = (input: string, abi: any): ParseEvmTransactionData | null => {
  const decoder = new InputDataDecoder(abi);
  const raw = decoder.decodeData(input);

  if (raw.method && raw.methodName) {
    const temp: ParseEvmTransactionData = {
      method: raw.method,
      methodName: raw.methodName,
      args: []
    };

    raw.types.forEach((type, index) => {
      temp.args.push(parseResult(type, raw.inputs[index], raw.names[index]));
    });

    return temp;
  } else {
    return null;
  }
};

export const parseContractInput = async (input: string, contractAddress: string, network: _ChainInfo | null): Promise<ResponseParseEvmContractInput> => {
  for (const abi of ABIs) {
    const temp = parseInputWithAbi(input, abi);

    if (temp) {
      return {
        result: temp
      };
    }
  }

  if (contractAddress && network) {
    if (_getEvmAbiExplorer(network)) {
      try {
        const res = await axios.get(_getEvmAbiExplorer(network), {
          params: {
            address: contractAddress
          },
          timeout: 3000
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (res.status === 200 && res.data.status === '1') {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
          const abi = res.data.result;
          const temp = parseInputWithAbi(input, abi);

          if (temp) {
            return {
              result: temp
            };
          }
        }
      } catch (e) {}
    }
  }

  return {
    result: input
  };
};

const getChainInfoByChainId = (networkMap: Record<string, _ChainInfo>, chainId: number): _ChainInfo | null => {
  if (!chainId) {
    for (const n in networkMap) {
      if (!Object.prototype.hasOwnProperty.call(networkMap, n)) {
        continue;
      }

      const networkInfo = networkMap[n];

      if (_isChainEvmCompatible(networkInfo)) {
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

    if (_getEvmChainId(networkInfo) === chainId) {
      return networkInfo;
    }
  }

  return null;
};

export const parseEvmRlp = async (data: string, networkMap: Record<string, _ChainInfo>, evmApiMap: Record<string, _EvmApi>): Promise<ResponseQrParseRLP> => {
  const tx: QrTransaction | null = createTransactionFromRLP(data);

  if (!tx) {
    throw new Error(t('Failed to decode data. Please use a valid QR code'));
  }

  const result: ResponseQrParseRLP = {
    input: tx.data,
    data: tx.data,
    gasPrice: new BigN(tx.gasPrice).toNumber(),
    gas: new BigN(tx.gas).toNumber(),
    to: tx.to,
    value: new BigN(tx.value).toNumber(),
    nonce: new BigN(tx.nonce).toNumber()
  };

  const network: _ChainInfo | null = getChainInfoByChainId(networkMap, parseInt(tx.ethereumChainId));

  for (const abi of ABIs) {
    const temp = parseInputWithAbi(tx.data, abi);

    if (temp) {
      result.data = temp;

      return result;
    }
  }

  if (tx.to && network) {
    if (await isContractAddress(tx.to, evmApiMap[network.slug])) {
      if (_getEvmAbiExplorer(network) !== '') {
        try {
          const res = await axios.get(_getEvmAbiExplorer(network), {
            params: {
              address: tx.to
            },
            timeout: 2000
          });

          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (res.status === 200 && res.data.status === '1') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
            const abi = res.data.result;
            const temp = parseInputWithAbi(tx.data, abi);

            if (temp) {
              result.data = temp;

              return result;
            }
          }
        } catch (e) {}
      }
    }
  }

  return result;
};
