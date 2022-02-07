// Copyright 2017-2021 @polkadot/react-signer authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type BN from 'bn.js';

import React from 'react';
import styled from 'styled-components';

import PaymentInfo from './PaymentInfo';
import {SubmittableExtrinsic} from "@polkadot/api/types";
import {ApiPromise} from "@polkadot/api";

interface Props {
  accountId: string | null;
  className?: string;
  extrinsic: SubmittableExtrinsic<'promise'>;
  isSendable: boolean;
  tip?: BN;
  api: ApiPromise;
  apiUrl: string
}

function Transaction ({ accountId, className, extrinsic, isSendable, tip, api, apiUrl }: Props): React.ReactElement<Props> | null {
  if (!extrinsic) {
    return null;
  }

  return (
    <div className={className}>
      <PaymentInfo
        accountId={accountId}
        className='tx-details'
        extrinsic={extrinsic}
        isSendable={isSendable}
        tip={tip}
        api={api}
        apiUrl={apiUrl}
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
