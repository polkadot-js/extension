// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SignerPayloadJSON } from '@polkadot/types/types';

import React, { useCallback, useContext, useEffect, useState } from 'react';

import { Loading, SigningReqContext } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { Header } from '../../partials';
import Request from './Request';
import TransactionIndex from './TransactionIndex';

export default function Signing (): React.ReactElement {
  const { t } = useTranslation();
  const requests = useContext(SigningReqContext);
  const [requestIndex, setRequestIndex] = useState(0);

  const _onNextClick = useCallback(
    () => setRequestIndex((requestIndex) => requestIndex + 1),
    []
  );

  const _onPreviousClick = useCallback(
    () => setRequestIndex((requestIndex) => requestIndex - 1),
    []
  );

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
  const isTransaction = !!((request?.request?.payload as SignerPayloadJSON)?.blockNumber);

  return request
    ? (
      <>
        <Header text={isTransaction ? t('Transaction') : t('Sign message')}>
          {requests.length > 1 && (
            <TransactionIndex
              index={requestIndex}
              onNextClick={_onNextClick}
              onPreviousClick={_onPreviousClick}
              totalItems={requests.length}
            />
          )}
        </Header>
        <Request
          account={request.account}
          buttonText={isTransaction ? t('Sign the transaction') : t('Sign the message')}
          isFirst={requestIndex === 0}
          request={request.request}
          signId={request.id}
          url={request.url}
        />
      </>
    )
    : <Loading />;
}
