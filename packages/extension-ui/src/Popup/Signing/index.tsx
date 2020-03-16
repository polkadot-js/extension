// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext, useState, useEffect } from 'react';

import { Header, Loading, SigningContext } from '../../components';
import Request from './Request';
import TransactionIndex from './TransactionIndex';
import { SigningRequest } from '@polkadot/extension-base/background/types';

export default function Signing (): React.ReactElement<{}> {
  const requests = useContext(SigningContext);
  const [requestIndex, setRequestIndex] = useState(0);

  useEffect(() => {
    if (requestIndex >= requests.length) {
      setRequestIndex(requests.length - 1);
    }
  }, [requests]);

  function isTransaction (signingRequest: SigningRequest): boolean {
    return 'blockNumber' in signingRequest.request.inner;
  }

  return requests[requestIndex] ? (
    <>
      <Header text={isTransaction(requests[requestIndex]) ? 'Transaction' : 'Sign message'}>
        {requests.length > 1 && (
          <TransactionIndex
            index={requestIndex}
            totalItems={requests.length}
            onNextClick={(): void => setRequestIndex(requestIndex + 1)}
            onPreviousClick={(): void => setRequestIndex(requestIndex - 1)}
          />
        )}
      </Header>
      <Request
        isFirst={requestIndex === 0}
        account={requests[requestIndex].account}
        request={requests[requestIndex].request}
        signId={requests[requestIndex].id}
        url={requests[requestIndex].url}
        buttonText={isTransaction(requests[requestIndex]) ? 'Sign the transaction' : 'Sign the message'}
      />
    </>
  ) : <Loading />;
}
