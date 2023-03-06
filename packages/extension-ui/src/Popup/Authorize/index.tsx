// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useContext } from 'react';
import styled from 'styled-components';

import { AuthorizeReqContext, PopupBorderContainer } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { Header } from '../../partials';
import Request from './Request';

interface Props extends ThemeProps {
  className?: string;
}

function Authorize({ className = '' }: Props): React.ReactElement {
  const { t } = useTranslation();
  const requests = useContext(AuthorizeReqContext);

  return (
    <PopupBorderContainer>
      <div className={`${className} ${requests.length === 1 ? 'lastRequest' : ''}`}>
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
  outline:  37px solid ${theme.warningColor};
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
`
);
