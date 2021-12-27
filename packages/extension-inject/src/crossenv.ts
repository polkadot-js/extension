// Copyright 2019-2021 @polkadot/extension-inject authors & contributors
// SPDX-License-Identifier: Apache-2.0

if (typeof chrome === 'undefined') {
  self.chrome = self.browser as unknown as typeof chrome;
}
