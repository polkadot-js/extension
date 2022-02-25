// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext, useEffect, useState } from 'react';

import { LoadingContainer, SigningReqContext } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import Request from './Request';
import { Header } from '@polkadot/extension-koni-ui/partials';

export default function Signing (): React.ReactElement {
  const { t } = useTranslation();
  const requests = useContext(SigningReqContext);
  const [requestIndex, setRequestIndex] = useState(0);

  useEffect(() => {
    setRequestIndex(
      (requestIndex) => requestIndex < requests.length
        ? requestIndex
        : requests.length - 1
    );
  }, [requests]);

  // protect against removal overflows/underflows
  const request = requests.length !== 0
    ? requestIndex >= 0
      ? requestIndex < requests.length
        ? requests[requestIndex]
        : requests[requests.length - 1]
      : requests[0]
    : null;
  // const isTransaction = !!((request?.request?.payload as SignerPayloadJSON)?.blockNumber);

  return request
    ? (
      <>
        <Header />
        <Request
          account={request.account}
          buttonText={t('Approve')}
          isFirst={requestIndex === 0}
          request={request.request}
          signId={request.id}
          url={request.url}
        />
      </>
    )
    : <LoadingContainer />;
}
