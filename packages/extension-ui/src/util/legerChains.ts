// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import networks from '@polkadot/networks';

export default networks.filter((network) => network.hasLedgerSupport);
