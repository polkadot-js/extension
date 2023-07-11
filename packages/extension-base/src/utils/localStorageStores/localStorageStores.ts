// Copyright 2019-2023 @polkadot/extension-bg authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

import createStoreDefinition from './createStoreDefinition';

/**
 * Since the browser local storage is scoped globally to the extensions, it's accessible from
 * the entire app. For this reason every time a new storage instance is to be created, we require
 * it to have its unique namespace registered in a central place in here to limit the possibility
 * of name collisions and shapes mismatch between usages.
 */
const STORES_DEFINITIONS = {

  chainMetadata: createStoreDefinition(
    z.record(z.object({
      chain: z.string(),
      genesisHash: z.string(),
      icon: z.string(),
      ss58Format: z.number(),
      chainType: z.enum(['substrate', 'ethereum']).optional()
    }).extend({
      color: z.string().optional(),
      specVersion: z.number(),
      tokenDecimals: z.number(),
      tokenSymbol: z.string(),
      types: // @polkadot/types-codec/types/registry.d.ts -> RegistryType
        z.record(z.union([
          z.string(),
          z.record(z.string()),
          z.object({
            _enum: z.union([
              z.array(z.string()),
              z.record(z.number()),
              z.record(z.string().or(z.null()))
            ])
          })
        ])),
      metaCalls: z.string().optional(),
      userExtensions: z.record(z.object({
        extrinsic: z.record(z.string()),
        payload: z.record(z.string())
      })).optional()
    })),
    {}
  ),

  defaultAuthAccounts: createStoreDefinition(z.array(z.string()), []),

  authUrls: createStoreDefinition(
    z.record(z.object({
      count: z.number(),
      id: z.string(),
      isAllowed: z.boolean().optional(),
      lastAuth: z.number(),
      origin: z.string(),
      url: z.string(),
      authorizedAccounts: z.array(z.string())
    })),
    {}
  ),

  welcomeRead: createStoreDefinition(z.literal('ok').or(z.undefined())),

  theme: createStoreDefinition(z.enum(['dark', 'light'])),

  signerRequestIds: createStoreDefinition(z.number(), 0)

  // This is one of the rare cases where "any" is fine, as it describes a generic, not a particular value's type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} satisfies { [namespace: string]: ReturnType<typeof createStoreDefinition<any>>};

export default Object.fromEntries(
  Object.entries(STORES_DEFINITIONS).map(([namespace, createStore]) => {
    return [namespace, createStore(namespace)];
  })
) as { [namespace in keyof typeof STORES_DEFINITIONS]: ReturnType<(typeof STORES_DEFINITIONS)[namespace]>};
