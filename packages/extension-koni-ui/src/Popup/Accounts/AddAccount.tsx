// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import Button from '@polkadot/extension-koni-ui/components/Button';
import Header from '@polkadot/extension-koni-ui/partials/Header';

import { ActionContext } from '../../components';
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

  const _importAccount = useCallback(
    () => onAction('/account/import-seed'),
    [onAction]
  );

  const _restoreAccount = useCallback(
    () => onAction('/account/restore-json'),
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
        <div className='koni-add-account-wrapper'>
          <div className='no-accounts'>
            <p>{t<string>("You currently don't have any accounts. Create your first account or import another account to get started.")}</p>
          </div>

          <Button
            className='kn-add-account-btn create-account'
            data-export-button
            onClick={_createNewAccount}
          >
            {t<string>('Create new account')}
          </Button>

          <Button
            className='kn-add-account-btn'
            data-export-button
            onClick={_importAccount}
          >
            {t<string>('Import account from pre-existing seed')}
          </Button>

          <Button
            className='kn-add-account-btn'
            data-export-button
            onClick={_restoreAccount}
          >
            {t<string>('Restore account from backup JSON file')}
          </Button>
        </div>
      </div>
    </>
  );
}

export default React.memo(styled(AddAccount)(({ theme }: Props) => `
  color: ${theme.textColor};
  height: 100%;

  .koni-add-account-wrapper {
    margin: 0 40px;
  }

  .kn-add-account-btn {
    margin-bottom: 15px;
  }

  .create-account {
    background-color: ${theme.buttonBackground2};
    color: ${theme.buttonTextColor3};
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
