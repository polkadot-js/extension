// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { TypedDataV1Field, typedSignatureHash } from '@metamask/eth-sig-util';
import Joi from 'joi';
import { isEthereumAddress } from '@polkadot/util-crypto';

export type SignTypedDataMessageV3V4 = {
  types: Record<string, unknown>;
  domain: Record<string, unknown>;
  primaryType: string;
  message: unknown;
};

export interface TypedMessageParams {
  from: string;
  data: Record<string, unknown>[] | string | SignTypedDataMessageV3V4;
}

export interface PersonalMessageParams {
  data: string;
  from: string;
}

export const joiValidate = Joi.object({
  types: Joi.object()
    .pattern(
      Joi.string(), // Key của object types
      Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          type: Joi.string().required()
        })
      )
    )
    .required(),
  primaryType: Joi.string().required(),
  domain: Joi.object().required(),
  message: Joi.object().required()
});

function validateAddress (address: string, propertyName: string) {
  if (!address || typeof address !== 'string' || !isEthereumAddress(address)) {
    throw new Error(
      `Invalid "${propertyName}" address: ${address} must be a valid string.`
    );
  }
}

export function validateSignMessageData (messageData: PersonalMessageParams) {
  const { data, from } = messageData;

  validateAddress(from, 'from');

  if (!data || typeof data !== 'string') {
    throw new Error(`Invalid message "data": ${data} must be a valid string.`);
  }

  return data;
}

export function validateTypedSignMessageDataV1 (messageData: TypedMessageParams) {
  validateAddress(messageData.from, 'from');

  if (!messageData.data || !Array.isArray(messageData.data)) {
    throw new Error(
      // TODO: Either fix this lint violation or explain why it's necessary to ignore.
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Invalid message "data": ${messageData.data} must be a valid array.`
    );
  }

  try {
    // typedSignatureHash will throw if the data is invalid.
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typedSignatureHash(messageData.data as TypedDataV1Field[]);

    return messageData.data
  } catch (e) {
    throw new Error('Expected EIP712 typed data.');
  }
}

export function validateTypedSignMessageDataV3V4 (
  messageData: TypedMessageParams,
) {
  validateAddress(messageData.from, 'from');

  if (
    !messageData.data ||
    Array.isArray(messageData.data) ||
    (typeof messageData.data !== 'object' &&
      typeof messageData.data !== 'string')
  ) {
    throw new Error(
      'Invalid message "data": Must be a valid string or object.'
    );
  }

  let data;

  if (typeof messageData.data === 'object') {
    data = messageData.data;
  } else {
    try {
      data = JSON.parse(messageData.data) as SignTypedDataMessageV3V4;
    } catch (e) {
      throw new Error('Data must be passed as a valid JSON string.');
    }
  }


  const validation = joiValidate.validate(data);

  if (validation.error) {
    throw new Error(
      'Data must conform to EIP-712 schema. See https://git.io/fNtcx.'
    );
  }

  // if (!currentChainId) {
  //   throw new Error('Current chainId cannot be null or undefined.');
  // }

  // let { chainId } = data.domain;
  //
  // if (chainId) {
  //   if (typeof chainId === 'string') {
  //     chainId = parseInt(chainId, chainId.startsWith('0x') ? 16 : 10);
  //   }
  //
  //   const activeChainId = parseInt(currentChainId, 16);
  //
  //   if (Number.isNaN(activeChainId)) {
  //     throw new Error(
  //       // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  //       // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  //       `Cannot sign messages for chainId "${chainId}", because MetaMask is switching networks.`
  //     );
  //   }
  //
  //   if (chainId !== activeChainId) {
  //     throw new Error(
  //       // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  //       // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  //       `Provided chainId "${chainId}" must match the active chainId "${activeChainId}"`
  //     );
  //   }
  // }
  return data;

}
