// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type BN from 'bn.js';

import React from 'react';
import styled from 'styled-components';

import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';

import PaymentInfo from './PaymentInfo';

interface Props {
  accountId: string | null;
  className?: string;
  extrinsic: SubmittableExtrinsic<'promise'>;
  isSendable: boolean;
  tip?: BN;
  api: ApiPromise;
  apiUrl: string;
  isBusy?: boolean;
}

function Transaction ({ accountId, api, apiUrl, className, extrinsic, isBusy, isSendable, tip }: Props): React.ReactElement<Props> | null {
  if (!extrinsic) {
    return null;
  }

  return (
    <div className={className}>
      <PaymentInfo
        accountId={accountId}
        api={api}
        apiUrl={apiUrl}
        className='tx-details'
        extrinsic={extrinsic}
        isBusy={isBusy}
        isSendable={isSendable}
        tip={tip}
      />
    </div>
  );
}

export default React.memo(styled(Transaction)`
  // .tx-details {
  //   .highlight {
  //     font-weight: 700;
  //   }
  //
  //   .meta {
  //     margin-bottom: 0.5rem;
  //     margin-left: 2rem;
  //   }
  //
  //   .meta, .mute {
  //     opacity: 0.6;
  //   }
  // }
`);
