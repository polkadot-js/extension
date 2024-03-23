// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext } from 'react';

import { AuthorizeReqContext } from '../../components/index.js';
import { useTranslation } from '../../hooks/index.js';
import { Header } from '../../partials/index.js';
import { styled } from '../../styled.js';
import Request from './Request.js';

interface Props {
  className?: string;
}

function Authorize ({ className = '' }: Props): React.ReactElement {
  const { t } = useTranslation();
  const requests = useContext(AuthorizeReqContext);

  return (
    <>
      <div className={`${className} ${requests.length === 1 ? 'lastRequest' : ''}`}>
        <Header
          smallMargin={true}
          text={t('Account connection request')}
        />
        {requests.map(({ id, request, url }, index): React.ReactNode => (
          <Request
            authId={id}
            className='request'
            isFirst={index === 0}
            key={id}
            request={request}
            url={url}
          />
        ))}
      </div>
    </>
  );
}

export default styled(Authorize)<Props>`
  overflow-y: auto;

  &.lastRequest {
    overflow: hidden;
  }

  && {
    padding: 0;
  }

  .request {
    padding: 0 24px;
  }
`;
