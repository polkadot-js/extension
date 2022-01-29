// Copyright 2017-2021 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

// import { keyring } from '@polkadot/ui-keyring';

import {BackgroundWindow} from "@polkadot/extension-base/background/KoniTypes";
import {AccountIdIsh} from "@polkadot/extension-koni-ui/util/types";

const bWindow = chrome.extension.getBackgroundPage() as BackgroundWindow;
const {keyring} = bWindow.pdotApi;

export function getAccountCryptoType (accountId: AccountIdIsh): string {
  try {
    const current = accountId
      ? keyring.getPair(accountId.toString())
      : null;

    if (current) {
      return current.meta.isInjected
        ? 'injected'
        : current.meta.isHardware
          ? current.meta.hardwareType as string || 'hardware'
          : current.meta.isExternal
            ? current.meta.isMultisig
              ? 'multisig'
              : current.meta.isProxied
                ? 'proxied'
                : 'external'
            : current.type;
    }
  } catch {
    // cannot determine, keep unknown
  }

  return 'unknown';
}
