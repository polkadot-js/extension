// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Header } from '@subwallet/extension-koni-ui/partials';
import React, { useContext, useEffect, useState } from 'react';

import { LoadingContainer, SigningReqContext } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import Request from './Request';

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
