// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { _Address } from '@subwallet/extension-base/background/KoniTypes';

// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const _ERC20_ABI = require('./erc20_abi.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const _ERC721_ABI = require('./erc721_abi.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const _TEST_ERC721_ABI = require('./test_erc721_abi.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const _PSP22_ABI: Record<string, any> = require('./psp22_abi.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const _PSP34_ABI: Record<string, any> = require('./psp34_abi.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const _PINK_PSP34_ABI: Record<string, any> = require('./pink_psp34_abi.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const _NEUROGUNS_PSP34_ABI: Record<string, any> = require('./neuroguns_psp34_abi.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const _AZERO_DOMAIN_REGISTRY_ABI: Record<string, any> = require('./azero_domain_registry_abi.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
export const _SNOWBRIDGE_GATEWAY_ABI: Record<string, any> = require('./snowbridge_gateway_abi.json');

const SNOWBRIDGE_GATEWAY_ETHEREUM_CONTRACT_ADDRESS = '0x27ca963C279c93801941e1eB8799c23f407d68e7';
const SNOWBRIDGE_GATEWAY_SEPOLIA_CONTRACT_ADDRESS = '0x5B4909cE6Ca82d2CE23BD46738953c7959E710Cd';

export function getSnowBridgeGatewayContract (chain: string) {
  if (chain === COMMON_CHAIN_SLUGS.ETHEREUM_SEPOLIA) {
    return SNOWBRIDGE_GATEWAY_SEPOLIA_CONTRACT_ADDRESS;
  }

  return SNOWBRIDGE_GATEWAY_ETHEREUM_CONTRACT_ADDRESS;
}

export function isSnowBridgeGatewayContract (contractAddress: _Address) {
  return [SNOWBRIDGE_GATEWAY_ETHEREUM_CONTRACT_ADDRESS, SNOWBRIDGE_GATEWAY_SEPOLIA_CONTRACT_ADDRESS].includes(contractAddress);
}
