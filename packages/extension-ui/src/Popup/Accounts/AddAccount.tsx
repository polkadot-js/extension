// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../../types';

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import { ActionContext } from '../../components';
import Header from '../../partials/Header';
import AddAccountImage from './AddAccountImage';

interface Props extends ThemeProps {
  className?: string;
}

function AddAccount ({ className }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);
  const _onClick = useCallback(
    (): void => onAction('/account/create'),
    [onAction]
  );

  return (
    <>
      <Header
        showSettings
        text='Add Account'
      />
      <div className={className}>
        <div className='image'>
          <AddAccountImage onClick={_onClick}/>
        </div>
        <div className='no-accounts'>
          <p>You currently don&apos;t have any accounts. Create your first account to get started.</p>
        </div>
      </div>
    </>
  );
}

export default React.memo(styled(AddAccount)(({ theme }: Props) => `
  color: ${theme.textColor};
  height: 100%;

  h3 {
    color: ${theme.textColor};
    margin-top: 0;
    font-weight: normal;
    font-size: 24px;
    line-height: 33px;
    text-align: center;
  }

  > .image {
    display: flex;
    justify-content: center;
  }

  > .no-accounts p {
    text-align: center;
    font-size: 16px;
    line-height: 26px;
    margin: 0 30px;
    color: ${theme.subTextColor};
  }
`));
