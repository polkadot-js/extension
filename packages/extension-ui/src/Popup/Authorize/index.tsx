// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext } from 'react';
import styled from 'styled-components';

import { AuthorizeReqContext, Loading, RequestPagination, ScrollWrapper } from '../../components';
import useRequestsPagination from '../../hooks/useRequestsPagination';
import useTranslation from '../../hooks/useTranslation';
import Request from './Request';

function Authorize(): React.ReactElement {
  const { t } = useTranslation();
  const requests = useContext(AuthorizeReqContext);
  const { index: requestIndex, next, previous, request } = useRequestsPagination(requests);

  return request ? (
    <ScrollWrapper>
      {requests.length > 1 && (
        <Centered>
          <RequestPagination
            index={requestIndex}
            onNextClick={next}
            onPreviousClick={previous}
            pluralName={t<string>('authorizations')}
            singularName={t<string>('authorization')}
            totalItems={requests.length}
          />
        </Centered>
      )}
      <Request
        authId={request.id}
        isFirst={requestIndex === 0}
        isLast={requests.length === 1}
        key={request.id}
        payload={request.payload}
        url={request.url}
      />
    </ScrollWrapper>
  ) :  (
    <Loading />
  );
}

export default Authorize;

const Centered = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;
