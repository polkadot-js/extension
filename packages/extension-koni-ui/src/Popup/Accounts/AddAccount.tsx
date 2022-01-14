// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useState } from 'react';
import styled from 'styled-components';

import { ActionContext } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import Header from '../../partials/Header';
import AddAccountImage from './AddAccountImage';
import { useSelector } from 'react-redux';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { PriceJson } from '@polkadot/extension-base/background/KoniTypes';

interface Props extends ThemeProps {
  className?: string;
}

function AddAccount ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const _onClick = useCallback(
    () => onAction('/account/create'),
    [onAction]
  );

  return (
    <>
      <Header
        showAdd
        showSettings
        text={t<string>('Add Account')}
      />
      <div className={className}>
        <div className='image'>
          <AddAccountImage onClick={_onClick} />
        </div>
        <div className='no-accounts'>
          <p>{t<string>("You currently don't have any accounts. Create your first account to get started.")}</p>
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
