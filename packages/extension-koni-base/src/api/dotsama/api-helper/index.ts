// Copyright 2017-2022 @polkadot/apps-config authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { OverrideBundleType } from '@polkadot/types/types';

import typesChain from './chain';
import spec from './spec';

export function getChainTypes (_specName: string, chainName: string): Record<string, string | Record<string, unknown>> {
  return {
    ...(typesChain[chainName as keyof typeof typesChain] || {})
  };
}

export const ethereumChains = [
  'moonbase',
  'moonbeam',
  'moonriver',
  'moonshadow',
  'origintrail-parachain'
];

export const typesBundle: OverrideBundleType = { spec };

export { typesChain };
