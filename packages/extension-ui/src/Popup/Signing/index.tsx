// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SigningRequest } from '@polkadot/extension-base/background/types';

import React, { useContext, useEffect, useMemo, useState } from 'react';

import { Loading, SigningReqContext } from '../../components';
import { Header } from '../../partials';
import Request from './Request';
import TransactionIndex from './TransactionIndex';

function isInnerTransaction (signingRequest: SigningRequest): boolean {
  return 'blockNumber' in signingRequest.request.inner;
}

export default function Signing (): React.ReactElement<{}> {
  const requests = useContext(SigningReqContext);
  const [requestIndex, setRequestIndex] = useState(0);
  const isTransaction = useMemo(
    () => isInnerTransaction(requests[requestIndex]),
    [requests, requestIndex]
  );

  useEffect(() => {
    setRequestIndex(
      (requestIndex) => requestIndex >= requests.length
        ? requests.length - 1
        : requestIndex
    );
  }, [requests]);

  return requests[requestIndex] ? (
    <>
      <Header text={isTransaction ? 'Transaction' : 'Sign message'}>
        {requests.length > 1 && (
          <TransactionIndex
            index={requestIndex}
            onNextClick={(): void => setRequestIndex(requestIndex + 1)}
            onPreviousClick={(): void => setRequestIndex(requestIndex - 1)}
            totalItems={requests.length}
          />
        )}
      </Header>
      <Request
        account={requests[requestIndex].account}
        buttonText={isTransaction ? 'Sign the transaction' : 'Sign the message'}
        isFirst={requestIndex === 0}
        request={requests[requestIndex].request}
        signId={requests[requestIndex].id}
        url={requests[requestIndex].url}
      />
    </>
  ) : <Loading />;
}
