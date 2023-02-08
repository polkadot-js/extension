// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import { MenuCard } from '@polkadot/extension-ui/components';

import addIcon from '../../assets/add.svg';
import uploadIcon from '../../assets/upload.svg';
import { ActionContext, Button, ButtonArea } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import Header from '../../partials/Header';

interface Props extends ThemeProps {
  className?: string;
}

function AddAccountMenu({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const goTo = useCallback((path: string) => () => onAction(path), [onAction]);

  return (
    <>
      <Header
        withBackArrow
        withHelp
        text={t<string>('Add Account')}
      />
      <div className={className}>
        <div className='add-account-menu'>
          <MenuCard
            description={t<string>('Generate a new public address')}
            onClick={goTo('/account/create')}
            preIcon={<img src={addIcon} />}
            title={t<string>('Create a new account')}
          />
          <MenuCard
            description={t<string>('Accounts created in other \n wallets are also supported')}
            onClick={goTo('/account/import-seed')}
            preIcon={<img src={uploadIcon} />}
            title={t<string>('Import an existing account')}
          />
        </div>
      </div>
      <ButtonArea>
        <Button
          onClick={goTo('/')}
          secondary
        >
          {t<string>('Cancel')}
        </Button>
      </ButtonArea>
    </>
  );
}

export default React.memo(
  styled(AddAccountMenu)(
    ({ theme }: Props) => `
  color: ${theme.textColor};
  height: 100%;
  height: calc(100vh - 2px);
  overflow-y: scroll;
  scrollbar-width: none;
  
  .add-account-menu{
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &::-webkit-scrollbar {
    display: none;
  }
  `
  )
);
