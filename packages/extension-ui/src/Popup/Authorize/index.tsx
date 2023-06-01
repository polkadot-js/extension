// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useContext } from 'react';
import styled from 'styled-components';

import { AuthorizeReqContext, Checkbox } from '../../components';
import Account from '../Accounts/Account';
import Request from './Request';

interface Props extends ThemeProps {
  className?: string;
}

function Authorize({ className = '' }: Props): React.ReactElement {
  const requests = useContext(AuthorizeReqContext);

  return (
    <>
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
    </>
  );
}

export default styled(Authorize)(
  ({ theme }: Props) => `

  .top {
    position: absolute;
    top: 0;
    margin-top: -5px;
  }

  .bottom {
    position: absolute;
    bottom: 0;
  }

  height: 584px;
  margin-top: 8px;
  overflow-y: scroll;
  overflow-x: hidden;

  ::-webkit-scrollbar-thumb {
    background:${theme.boxBorderColor};
    border-radius: 50px;  
    width: 2px;  
    border-right: 2px solid #111B24;
  }

  ::-webkit-scrollbar {
    width: 4px;
  }

  ${Account} {
    padding: 0px 4px;
    
    ${Checkbox} {
      margin-left: 8px;
    }
  }

  &.lastRequest {
    overflow-y: scroll;

    ::-webkit-scrollbar-thumb {
      background:${theme.boxBorderColor};
      border-radius: 50px;  
      width: 2px;  
      border-right: 2px solid #111B24;
    }
  
    ::-webkit-scrollbar {
      width: 4px;
    }
  }

  && {
    padding: 0;
  }
`
);
