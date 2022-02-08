// Copyright 2017-2022 @polkadot/apps-config authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TypeRegistry, U128 } from '@polkadot/types';

export function balanceOf (number: number | string): U128 {
  return new U128(new TypeRegistry(), number);
}

export function typesFromDefs (definitions: Record<string, { types: Record<string, any> }>): Record<string, any> {
  return Object
    .values(definitions)
    .reduce((res: Record<string, any>, { types }): Record<string, any> => ({
      ...res,
      ...types
    }), {});
}
