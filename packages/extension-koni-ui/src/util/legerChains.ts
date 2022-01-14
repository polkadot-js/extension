// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { selectableNetworks } from '@polkadot/networks';

export default selectableNetworks.filter((network) => network.hasLedgerSupport);
