// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { FunctionFragment, JsonFragment, Result } from '@ethersproject/abi';
import { NestedArray } from '@subwallet/extension-base/background/KoniTypes';
import { Buffer } from 'buffer';
import { ethers } from 'ethers';
import isBuffer from 'is-buffer';
// @ts-ignore
import { _jsonInterfaceMethodToString, AbiInput, AbiItem, keccak256 } from 'web3-utils';

export interface InputData {
  method: string | null;
  methodName: string | null;
  types: string[];
  inputs: NestedArray<any>[];
  names: NestedArray<string>[];
}

const ABI_TYPES = ['function', 'constructor', 'event', 'fallback'];

const instanceOfAbiItem = (object: any): object is AbiItem => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
  return 'type' in object && ABI_TYPES.includes(object.type);
};

const checkArrayAbiItems = (data: AbiItem[] | any): boolean => {
  if (Array.isArray(data)) {
    return data.length > 0 && data.every((value) => instanceOfAbiItem(value));
  } else {
    return false;
  }
};

const genType = (type: AbiInput | string): string => {
  if (typeof type === 'string') {
    return type;
  } else {
    if (type.components) {
      const arr: string[] = type.components?.map(genType);

      const tupleStr = `(${arr.join(',')})`;

      if (type.type === 'tuple[]') {
        return tupleStr + '[]';
      } else {
        return tupleStr;
      }
    } else {
      return type.type;
    }
  }
};

const getMethodId = (abi: AbiItem): string => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call
  return keccak256(_jsonInterfaceMethodToString(abi)).slice(2, 10);
};

const getMethodName = (abi: AbiItem): string => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call
  return _jsonInterfaceMethodToString(abi) as string;
};

const deepRemoveUnwantedArrayProperties = (arr: any[] | Result): any[] => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-return
  return [...arr.map((item) => {
    if (Array.isArray(item)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return deepRemoveUnwantedArrayProperties(item);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return item;
  })];
};

// remove 0x from addresses
const deepStripTupleAddresses = (input: any[], tupleTypes: AbiInput[]): any[] => input.map((item, i) => {
  // We find tupleTypes to not be an array where internalType is present in the ABI indicating item is a structure
  const type = tupleTypes[i] ? tupleTypes[i].type : null;

  if (type === 'address' && typeof item === 'string') {
    return item;
  }

  if (type === 'address[]' && Array.isArray(item)) {
    return item.map((a) => a as string);
  }

  if (Array.isArray(item)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return deepStripTupleAddresses(item, tupleTypes);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return item;
});

const toHexString = (byteArray: Buffer) => {
  return Array.from(byteArray, function (byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
};

export class InputDataDecoder {
  readonly abi: AbiItem[];

  constructor (prop: string | AbiItem[] | any) {
    this.abi = [];

    if (typeof prop === 'string') {
      try {
        this.abi = JSON.parse(prop) as AbiItem[];
      } catch (err) {
        throw new Error('Invalid ABI: ' + (err as Error).message);
      }
    } else if (checkArrayAbiItems(prop)) {
      this.abi = prop as AbiItem[];
    } else {
      throw new TypeError('Must pass ABI array object or file path to constructor');
    }
  }

  decodeConstructor (data: Buffer | string): InputData {
    if (isBuffer(data)) {
      data = data.toString('utf8');
    }

    if (typeof data !== 'string') {
      data = '';
    }

    data = data.trim();

    for (let i = 0; i < this.abi.length; i++) {
      const obj = this.abi[i];

      if (obj.type !== 'constructor') {
        continue;
      }

      const method = obj.name || null;
      const methodName = getMethodName(obj);
      const types = obj.inputs ? obj.inputs.map((x) => x.type) : [];
      const names = obj.inputs ? obj.inputs.map((x) => x.name) : [];

      // take last 32 bytes
      data = data.slice(-256);

      if (data.length !== 256) {
        throw new Error('fail');
      }

      if (data.indexOf('0x') !== 0) {
        data = `0x${data}`;
      }

      const _inputs = ethers.AbiCoder.defaultAbiCoder().decode(types, data);

      const inputs = deepRemoveUnwantedArrayProperties(_inputs);

      return {
        methodName,
        method,
        types,
        inputs,
        names
      };
    }

    throw new Error('not found');
  }

  decodeData (data: Buffer | string) {
    if (isBuffer(data)) {
      data = data.toString('utf8');
    }

    if (typeof data !== 'string') {
      data = '';
    }

    data = data.trim();

    const dataBuf = Buffer.from(data.replace(/^0x/, ''), 'hex');
    const methodId = toHexString(dataBuf.subarray(0, 4));
    const inputsBuf = dataBuf.subarray(4);

    let result: InputData = { method: null, methodName: null, types: [], inputs: [], names: [] };

    for (const abi of this.abi) {
      try {
        if (abi.type === 'constructor') {
          continue;
        }

        if (abi.type === 'event') {
          continue;
        }

        const method = abi.name || null;
        const methodName = getMethodName(abi);
        const types = abi.inputs
          ? abi.inputs.map((x) => {
            if (x.type.includes('tuple')) {
              return x;
            } else {
              return x.type;
            }
          })
          : [];

        const names = abi.inputs
          ? abi.inputs.map((x) => {
            if (x.type.includes('tuple') && x.components) {
              return [x.name, x.components.map((a) => a.name)];
            } else {
              return x.name;
            }
          })
          : [];

        const hash = getMethodId(abi);

        if (hash === methodId) {
          let inputs: Result = [];

          try {
            // @ts-ignore
            inputs = ethers.AbiCoder.defaultAbiCoder().decode(types, inputsBuf);
          } catch (err) {
            try {
              const ifc = new ethers.Interface([]);

              inputs = ifc.decodeFunctionData(ethers.FunctionFragment.from(abi as JsonFragment), data);
            } catch (err) {}
          }

          // TODO: do this normalization into normalizeAddresses
          let _inputs: any[] = [];

          _inputs = inputs.map((input, i) => {
            if ((types[i] as AbiInput).components) {
              const tupleTypes = (types[i] as AbiInput).components;

              // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-argument
              return deepStripTupleAddresses(input, tupleTypes as AbiInput[]);
            }

            if (types[i] === 'address' && typeof input === 'string') {
              return input;
            }

            if (types[i] === 'address[]' && Array.isArray(input)) {
              return input.map((address) => address as string);
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return input;
          });

          // Map any tuple types into arrays
          const typesToReturn = types.map(genType);

          // defaultAbiCoder attaches some unwanted properties to the list object
          _inputs = deepRemoveUnwantedArrayProperties(_inputs);

          result = {
            methodName,
            method,
            types: typesToReturn,
            inputs: _inputs,
            names
          };
        }
      } catch (err) {
        console.log(err);
      }
    }

    if (!result.method) {
      for (const obj of this.abi) {
        if (obj.type === 'constructor') {
          continue;
        }

        if (obj.type === 'event') {
          continue;
        }

        const method = obj.name || null;

        try {
          const ifc = new ethers.Interface([]);
          const _result = ifc.decodeFunctionData(ethers.FunctionFragment.from(obj as FunctionFragment), data);
          const inputs = deepRemoveUnwantedArrayProperties(_result);

          result.method = method;
          result.methodName = getMethodName(obj);
          result.inputs = inputs;
          result.names = obj.inputs
            ? obj.inputs.map((x) => {
              if (x.type.includes('tuple')) {
                return [x.name, x.components?.map((a) => a.name) || ''];
              } else {
                return x.name;
              }
            })
            : [];
          const types = obj.inputs
            ? obj.inputs.map((x) => {
              if (x.type.includes('tuple')) {
                return x;
              } else {
                return x.type;
              }
            })
            : [];

          result.types = types.map(genType);
        } catch (err) {}
      }
    }

    if (!result.method) {
      try {
        const decoded = this.decodeConstructor(data);

        if (decoded) {
          return decoded;
        }
      } catch (err) { }
    }

    return result;
  }
}
