// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import Web3 from 'web3';

import { WsProvider } from '@polkadot/api';

export async function checkSubstrateEndpoint (endpoint: string, timeout: number): Promise<boolean> {
  const wsProvider = new WsProvider(endpoint, false, undefined, timeout);

  try {
    await wsProvider.connect();

    return await new Promise((resolve) => {
      wsProvider.on('connected', () => {
        wsProvider.send('system_health', []).then((systemHealth) => {
          resolve(true);
        }).catch(console.log);
      });
    });
  } catch (error) {
    console.log(`${endpoint}: fail to check health`);

    return false; // if there is an error, return false
  } finally {
    await wsProvider.disconnect(); // disconnect from the endpoint after the health check is complete
  }
}

export async function checkEvmEndpoint (endpoint: string, timeout: number): Promise<boolean> {
  try {
    const web3 = new Web3(endpoint);
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(false), timeout));
    const blockNumber = await Promise.race([web3.eth.getBlockNumber(), timeoutPromise]);

    return !!blockNumber;
  } catch (error) {
    console.log(error);

    return false;
  }
}

export async function checkProviders (providers: Record<string, string>, timeout = 5000): Promise<Record<string, boolean>> {
  const healthMap = await Promise.all(Object.keys(providers).map(async (providerKey) => {
    const endpoint = providers[providerKey];

    // Allow light client success by default
    if (endpoint.startsWith('light://')) {
      return [providerKey, true];
    }

    const checkPromise: Promise<boolean> = endpoint.startsWith('wss://') ? checkSubstrateEndpoint(endpoint, timeout) : checkEvmEndpoint(endpoint, timeout);
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(false), timeout));
    const health = await Promise.race([checkPromise, timeoutPromise]);

    return [providerKey, health];
  })).then((res) => Object.fromEntries(res) as Record<string, boolean>);

  return healthMap;
}
