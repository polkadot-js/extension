// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext } from 'react';

import { ActionContext } from '../../components/index.js';
import { useTranslation } from '../../hooks/index.js';
import Header from '../../partials/Header.js';
import { styled } from '../../styled.js';
import AddAccountImage from './AddAccountImage.js';

interface Props {
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
        text={t('Add Account')}
      />
      <div className={className}>
        <div className='image'>
          <AddAccountImage onClick={_onClick} />
        </div>
        <div className='no-accounts'>
          <p>{t("You currently don't have any accounts. Create your first account to get started.")}</p>
        </div>
      </div>
    </>
  );
}

export default React.memo(styled(AddAccount)<Props>`
  color: var(--textColor);
  height: 100%;

  h3 {
    color: var(--textColor);
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
    color: var(--subTextColor);
  }
`);
