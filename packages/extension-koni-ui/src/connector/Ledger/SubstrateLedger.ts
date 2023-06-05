// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Ledger } from '@subwallet/extension-koni-ui/connector/Ledger/index';

import { Ledger as ZondaxLedger } from '@polkadot/hw-ledger';

export class SubstrateLedger extends ZondaxLedger implements Ledger {

}
