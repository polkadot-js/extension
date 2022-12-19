// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ScProvider } from '@polkadot/rpc-provider';

export const relayChainSpecs: Record<string, string> = {
  kusama: ScProvider.WellKnownChain.ksmcc3,
  polkadot: ScProvider.WellKnownChain.polkadot,
  rococo: ScProvider.WellKnownChain.rococo_v2_2,
  westend: ScProvider.WellKnownChain.westend2
};

export const paraChainSpecs: Record<string, string> = {
  'kusama/shiden': './kusama/shiden.json',
  'kusama/tinkernet': './kusama/tinkernet.json',
  'polkadot/astar': './polkadot/astar.json'
};

export async function getSubstrateConnectProvider (networkKey: string): Promise<ScProvider> {
  let spec: string = relayChainSpecs[networkKey];
  const paraChainSpec = paraChainSpecs[networkKey];

  if (paraChainSpec) {
    spec = (await import(paraChainSpec)) as string;
  }

  return new ScProvider(spec);
}
