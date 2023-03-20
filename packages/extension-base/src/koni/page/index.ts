// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

// the enable function, called by the dapp to allow access
import { SubWalletEvmProvider } from '@subwallet/extension-base/koni/page/SubWalleEvmProvider';
import { sendMessage } from '@subwallet/extension-base/page';
import { EvmProvider } from '@subwallet/extension-inject/types';

export function initEvmProvider (version: string): EvmProvider {
  return new SubWalletEvmProvider(sendMessage, version);
}
