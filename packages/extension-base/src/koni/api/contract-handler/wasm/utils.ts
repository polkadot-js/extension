// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { WeightV2 } from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import { BN } from '@polkadot/util';

const MAX_CALL_WEIGHT = '5000000000000';
const DEFAULT_REF_TIME = '1000000000000';

const toContractAbiMessage = (contractPromise: ContractPromise, message: string) => {
  const value = contractPromise.abi.messages.find((m) => m.method === message);

  if (!value) {
    const messages = contractPromise?.abi.messages
      .map((m) => m.method)
      .join(', ');

    const error = `"${message}" not found in metadata.spec.messages: [${messages}]`;

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

    const { gasRequired } = await api.call.contractsApi.call(
      callerAddress,
      contract.address,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      value ?? new BN(0),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      gasLimit ?? null,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      storageDepositLimit ?? null,
      // @ts-ignore
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
