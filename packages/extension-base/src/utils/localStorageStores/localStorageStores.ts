import { z } from 'zod';

import * as commonSchemas from './commonSchemas';
import createStoreDefinition from './createStoreDefinition';

/**
 * Since the browser local storage is scoped globally to the extensions, it's accessible from
 * the entire app. For this reason every time a new storage instance is to be created, we require
 * it to have its unique namespace registered in a central place in here to limit the possibility
 * of name collisions and shapes mismatch between usages.
 */
const STORES_DEFINITIONS = {

  chainMetadata: createStoreDefinition(
    z.record(commonSchemas.metadata),
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

  signerRequestIds: createStoreDefinition(z.number(), 0),

  signRequests: createStoreDefinition(z.array(z.object({
    id: z.string(),
    requestingTabId: z.number(),
    url: z.string(),
    account: z.object({
      address: z.string(),
      genesisHash: z.string().nullable().optional(),
      isExternal: z.boolean().optional(),
      isHardware: z.boolean().optional(),
      isHidden: z.boolean().optional(),
      isDefaultAuthSelected: z.boolean().optional(),
      name: z.string().optional(),
      parentAddress: z.string().optional(),
      suri: z.string().optional(),
      type: z.enum(['ed25519', 'sr25519', 'ecdsa', 'ethereum']).optional(),
      whenCreated: z.number().optional()
    }),
    payload: z.union([
      z.object({
        signType: z.literal('bytes'),
        address: z.string(),
        type: z.enum(['bytes', 'payload']),
        data: z.string()
      }),
      z.object({
        signType: z.literal('extrinsic'),
        address: z.string(),
        blockHash: z.string(),
        blockNumber: z.string(),
        era: z.string(),
        genesisHash: z.string(),
        method: z.string(),
        nonce: z.string(),
        specVersion: z.string(),
        tip: z.string(),
        transactionVersion: z.string(),
        signedExtensions: z.array(z.string()),
        version: z.number()
      })
    ])
  })), []),

  metadataRequests: createStoreDefinition(z.array(z.object({
    id: z.string(),
    requestingTabId: z.number(),
    url: z.string(),
    payload: commonSchemas.metadata
  })), []),

  authRequests: createStoreDefinition(z.array(z.object({
    id: z.string(),
    requestingTabId: z.number(),
    idStr: z.string(),
    url: z.string(),
    payload: z.object({
      origin: z.string()
    })
  })), [])

  // This is one of the rare cases where "any" is fine, as it describes a generic, not a particular value's type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} satisfies { [namespace: string]: ReturnType<typeof createStoreDefinition<any>>};

export default Object.fromEntries(
  Object.entries(STORES_DEFINITIONS).map(([namespace, createStore]) => {
    return [namespace, createStore(namespace)];
  })
) as { [namespace in keyof typeof STORES_DEFINITIONS]: ReturnType<(typeof STORES_DEFINITIONS)[namespace]>};
