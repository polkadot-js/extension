// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';
import Button from '@polkadot/extension-koni-ui/components/Button';
import Header from '@polkadot/extension-koni-ui/partials/Header';
import {ActionContext, Link} from '../../components';
import useTranslation from '../../hooks/useTranslation';

interface Props extends ThemeProps {
  className?: string;
}

function AddAccount ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const _createNewAccount = useCallback(
    () => onAction('/account/create'),
    [onAction]
  );

  return (
    <>
      <Header
        isNotHaveAccount
        showAdd
        showSettings
        showSubHeader
        subHeaderName={t<string>('Add Account')}
      />
      <div className={className}>
        <div className='add-account-wrapper'>
          <div className='no-accounts'>
            <p>{t<string>("You currently don't have any accounts. Create your first account or import another account to get started.")}</p>
          </div>

          <Button
            className='add-account-btn create-account'
            data-export-button
            onClick={_createNewAccount}
          >
            {t<string>('Create new account')}
          </Button>

          <Button
            className='add-account-btn'
            data-export-button
          >
            <Link to={`/account/import-seed`} className='add-account-link'>
              {t<string>('Import account from pre-existing seed')}
            </Link>
          </Button>

          <Button
            className='add-account-btn'
            data-export-button
          >
            <Link to={`/account/restore-json`} className='add-account-link'>
              {t<string>('Restore account from backup JSON file')}
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}

export default React.memo(styled(AddAccount)(({ theme }: Props) => `
  color: ${theme.textColor};
  height: 100%;

  .add-account-wrapper {
    margin: 0 40px;
  }

  .add-account-btn {
    margin-bottom: 15px;
  }

  .create-account {
    background-color: ${theme.buttonBackground2};
    color: ${theme.buttonTextColor3};
  }

  .add-account-link {
    justify-content: center;
    color: ${theme.textColor};
    opacity: 1;
  }

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

  .no-accounts {
    margin: 20px 0 50px;
  }

  .no-accounts p {
    text-align: center;
    font-size: 15px;
    line-height: 24px;
    color: ${theme.textColor};
  }
`));
