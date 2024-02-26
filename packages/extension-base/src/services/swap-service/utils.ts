// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { Chain } from '@chainflip/sdk/swap';

export function chainFlipConvertChainId (chainSlug: string): Chain {
  // todo: more logic here
  return (chainSlug[0].toUpperCase() + chainSlug.slice(1)) as Chain;
}
