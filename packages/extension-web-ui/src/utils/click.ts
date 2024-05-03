// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

export function stopClickPropagation (event: React.MouseEvent): void {
  event.stopPropagation();
}
