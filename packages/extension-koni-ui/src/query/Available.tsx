// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountId, AccountIndex, Address } from '@polkadot/types/interfaces';

import BN from 'bn.js';
import React from 'react';

import { ChainRegistry } from '@polkadot/extension-koni-base/api/types';

import FormatBalance from './FormatBalance';

// import {useApi, useCall} from "@polkadot/extension-koni-ui/hooks/SendFundHooks";

interface Props {
  children?: React.ReactNode;
  className?: string;
  label?: React.ReactNode;
  params?: AccountId | AccountIndex | Address | string | Uint8Array | null;
}

function Available ({ children, className = '', label, params }: Props): React.ReactElement<Props> {
  const chainRegistry: ChainRegistry = {
    chainDecimals: [10],
    chainTokens: ['DOT']
  };

  return (
    <FormatBalance
      className={className}
      label={label}
      registry={chainRegistry}
      value={new BN(0)}
    >
      {children}
    </FormatBalance>
  );
}

export default React.memo(Available);
