// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomTokenJson, CustomTokenType, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { isEqualContractAddress } from '@subwallet/extension-koni-base/api/tokens';
import { DEFAULT_WASM_TOKENS } from '@subwallet/extension-koni-base/api/tokens/wasm/defaultWasmToken';
import { PSP22Contract, PSP34Contract, ShidenPSP34Contract } from '@subwallet/extension-koni-base/api/tokens/wasm/helper';

import { ApiPromise } from '@polkadot/api';
import { Abi, ContractPromise } from '@polkadot/api-contract';
import { WeightV2 } from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import { BN } from '@polkadot/util';

// @ts-ignore
const MAX_CALL_WEIGHT = '5000000000000';
const DEFAULT_REF_TIME = '1000000000000';

export interface WasmContractResponse {
  ok: any;
}

const toContractAbiMessage = (contractPromise: ContractPromise, message: string) => {
  const value = contractPromise.abi.messages.find((m) => m.method === message);

  if (!value) {
    const messages = contractPromise?.abi.messages
      .map((m) => m.method)
      .join(', ');

    const error = `"${message}" not found in metadata.spec.messages: [${messages}]`;

    console.error(error);

    return { ok: false, error };
  }

  return { ok: true, value };
};

export async function getWasmContractGasLimit (
  api: ApiPromise,
  callerAddress: string,
  message: string,
  contract: ContractPromise,
  options = {},
  args = []
) {
  try {
    const abiMessage = toContractAbiMessage(contract, message);

    if (!abiMessage.ok) {
      return getDefaultWeightV2(api, true);
    }

    // @ts-ignore
    const { gasLimit, storageDepositLimit, value } = options;

    // @ts-ignore
    const { gasRequired } = await api.call.contractsApi.call(
      callerAddress,
      contract.address,
      value ?? new BN(0),
      gasLimit ?? null,
      storageDepositLimit ?? null,
      abiMessage?.value?.toU8a(args)
    );

    return gasRequired as Codec;
  } catch {
    return getDefaultWeightV2(api, true);
  }
}

export function getDefaultWeightV2 (apiPromise: ApiPromise, isFallback?: boolean): WeightV2 {
  const proofSize = isFallback ? 3407872 : MAX_CALL_WEIGHT; // TODO: handle error better
  const refTime = isFallback ? 32490000000 : DEFAULT_REF_TIME;

  return apiPromise.registry.createType('WeightV2', {
    refTime,
    proofSize
  });
}

export async function validateWasmToken (chain: string, contractAddress: string, tokenType: CustomTokenType.psp22 | CustomTokenType.psp34, apiPromise: ApiPromise, contractCaller?: string) {
  let tokenContract: ContractPromise;
  let name = '';
  let decimals: number | undefined = -1;
  let symbol = '';
  let contractError = false;

  try {
    if (tokenType === CustomTokenType.psp22) {
      tokenContract = new ContractPromise(apiPromise, PSP22Contract, contractAddress);

      const [nameResp, symbolResp, decimalsResp] = await Promise.all([
        tokenContract.query['psp22Metadata::tokenName'](contractCaller || contractAddress, { gasLimit: getDefaultWeightV2(apiPromise) }), // read-only operation so no gas limit
        tokenContract.query['psp22Metadata::tokenSymbol'](contractCaller || contractAddress, { gasLimit: getDefaultWeightV2(apiPromise) }),
        tokenContract.query['psp22Metadata::tokenDecimals'](contractCaller || contractAddress, { gasLimit: getDefaultWeightV2(apiPromise) })
      ]);

      if (!(nameResp.result.isOk && symbolResp.result.isOk && decimalsResp.result.isOk) || !nameResp.output || !decimalsResp.output || !symbolResp.output) {
        console.error('Error response while validating WASM contract');

        return {
          name: '',
          decimals: -1,
          symbol: '',
          contractError: true
        };
      } else {
        const symbolObj = symbolResp.output?.toHuman() as Record<string, any>;
        const decimalsObj = decimalsResp.output?.toHuman() as Record<string, any>;
        const nameObj= nameResp.output?.toHuman() as Record<string, any>;

        name = nameResp.output ? (nameObj.Ok as string || nameObj.ok as string) : '';
        decimals = decimalsResp.output ? (new BN((decimalsObj.Ok || decimalsObj.ok) as string | number)).toNumber() : 0;
        symbol = decimalsResp.output ? (symbolObj.Ok as string || symbolObj.ok as string) : '';

        if (name === '' || symbol === '') {
          contractError = true;
        }

        console.log('validate PSP22', name, symbol, decimals);
      }
    } else {
      if (['astar', 'shiden', 'shibuya'].includes(chain)) {
        const abi = new Abi(ShidenPSP34Contract, apiPromise.registry.getChainProperties());

        tokenContract = new ContractPromise(apiPromise, abi, contractAddress);
      } else {
        tokenContract = new ContractPromise(apiPromise, PSP34Contract, contractAddress);
      }

      // @ts-ignore
      const collectionIdResp = await tokenContract.query['psp34::collectionId'](contractCaller || contractAddress, { gasLimit: getDefaultWeightV2(apiPromise) }); // read-only operation so no gas limit

      if (!collectionIdResp.result.isOk || !collectionIdResp.output) {
        console.error('Error response while validating WASM contract');

        return {
          name: '',
          decimals: -1,
          symbol: '',
          contractError: true
        };
      } else {
        const collectionIdDict = collectionIdResp.output?.toHuman() as Record<string, string>;

        if (collectionIdDict.Bytes === '') {
          contractError = true;
        } else {
          name = ''; // no function to get collection name, let user manually put in the name
        }
      }
    }

    return {
      name,
      decimals,
      symbol,
      contractError
    };
  } catch (e) {
    console.error('Error validating WASM contract', e);

    return {
      name: '',
      decimals: -1,
      symbol: '',
      contractError: true
    };
  }
}

export function initWasmTokenState (customTokenState: CustomTokenJson, networkMap: Record<string, NetworkJson>) {
  const wasmTokenState = { psp22: customTokenState.psp22 || [], psp34: customTokenState.psp34 || [] };

  for (const defaultToken of DEFAULT_WASM_TOKENS.psp22) {
    let exist = false;

    for (const storedToken of wasmTokenState.psp22) {
      if (isEqualContractAddress(defaultToken.smartContract, storedToken.smartContract) && defaultToken.chain === storedToken.chain) {
        if (storedToken.isCustom) {
          // if existed, migrate the custom token -> default token
          delete storedToken.isCustom;
        }

        exist = true;
        break;
      }
    }

    if (!exist) {
      wasmTokenState.psp22.push(defaultToken);
    }
  }

  for (const defaultToken of DEFAULT_WASM_TOKENS.psp34) {
    let exist = false;

    for (const storedToken of wasmTokenState.psp34) {
      if (isEqualContractAddress(defaultToken.smartContract, storedToken.smartContract) && defaultToken.chain === storedToken.chain) {
        if (storedToken.isCustom) {
          // if existed, migrate the custom token -> default token
          delete storedToken.isCustom;
        }

        exist = true;
        break;
      }
    }

    if (!exist) {
      wasmTokenState.psp34.push(defaultToken);
    }
  }

  // Update networkKey in case networkMap change
  for (const token of wasmTokenState.psp22) {
    if (!(token.chain in networkMap) && token.chain.startsWith('custom_')) {
      let newKey = '';
      const genesisHash = token.chain.split('custom_')[1]; // token from custom network has key with prefix custom_

      for (const [key, network] of Object.entries(networkMap)) {
        if (network.genesisHash.toLowerCase() === genesisHash.toLowerCase()) {
          newKey = key;
          break;
        }
      }

      token.chain = newKey;
    }
  }

  for (const token of wasmTokenState.psp34) {
    if (!(token.chain in networkMap) && token.chain.startsWith('custom_')) {
      let newKey = '';
      const genesisHash = token.chain.split('custom_')[1]; // token from custom network has key with prefix custom_

      for (const [key, network] of Object.entries(networkMap)) {
        if (network.genesisHash.toLowerCase() === genesisHash.toLowerCase()) {
          newKey = key;
          break;
        }
      }

      token.chain = newKey;
    }
  }

  return wasmTokenState;
}
