// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useContext } from 'react';
import styled from 'styled-components';

import { AccountContext, AuthorizeReqContext, PopupBorderContainer } from '../../components';
import Request from './Request';

interface Props extends ThemeProps {
  className?: string;
}

function Authorize({ className = '' }: Props): React.ReactElement {
  const requests = useContext(AuthorizeReqContext);
  const { accounts } = useContext(AccountContext);
  const classes = [requests.length === 1 ? 'lastRequest' : null, !accounts.length ? 'warning-outline' : null]
    .filter(Boolean)
    .join(' ');

  return (
    <PopupBorderContainer>
      <div className={`${className} ${classes}`}>
        {requests.map(
          ({ id, request, url }, index): React.ReactNode => (
            <Request
              authId={id}
              className='request'
              isFirst={index === 0}
              key={id}
              request={request}
              url={url}
            />
          )
        )}
      </div>
    </PopupBorderContainer>
  );
}

export default styled(Authorize)(
  ({ theme }: Props) => `
  overflow-y: auto;  
  outline:  37px solid ${theme.newTransactionBackground};
  border-radius: 32px;
  height: 584px;
  margin-top: 8px;
  overflow-y: hidden;
  overflow-x: hidden;

  &.lastRequest {
    overflow: hidden;
  }

  && {
    padding: 0;
  }

  .request {
    padding: 0 24px;
  }

  &.warning-outline {
    outline:  37px solid ${theme.warningColor};
  }
`
);
