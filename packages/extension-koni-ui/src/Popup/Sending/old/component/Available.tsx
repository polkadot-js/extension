// Copyright 2017-2021 @polkadot/react-query authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type {DeriveBalancesAll} from '@polkadot/api-derive/types';
import type {AccountId, AccountIndex, Address} from '@polkadot/types/interfaces';

import React from 'react';

import FormatBalance from './FormatBalance';
import {ApiPromise} from "@polkadot/api";
import {useCall} from "@polkadot/extension-koni-ui/Popup/Sending/old/hook/useCall";

interface Props {
  children?: React.ReactNode;
  className?: string;
  label?: React.ReactNode;
  params?: AccountId | AccountIndex | Address | string | Uint8Array | null;
  api: ApiPromise
  apiUrl: string
}

function AvailableDisplay ({ children, className = '', label, params, api, apiUrl}: Props): React.ReactElement<Props> {
  const allBalances = useCall<DeriveBalancesAll>(api.derive.balances?.all, [params], undefined, apiUrl);

  return (
    <FormatBalance
      className={className}
      label={label}
      registry={api.registry}
      value={params ? allBalances?.availableBalance : undefined}
    >
      {children}
    </FormatBalance>
  );
}

export default React.memo(AvailableDisplay);
