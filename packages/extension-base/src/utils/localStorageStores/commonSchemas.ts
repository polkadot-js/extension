// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export const metadata = z.object({
  chain: z.string(),
  genesisHash: z.string(),
  icon: z.string(),
  ss58Format: z.number(),
  chainType: z.enum(['substrate', 'ethereum']).optional(),
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
});
