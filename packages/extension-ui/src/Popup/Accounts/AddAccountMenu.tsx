// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React from 'react';
import styled from 'styled-components';

import { MenuCard } from '@polkadot/extension-ui/components';

import useTranslation from '../../hooks/useTranslation';
import Header from '../../partials/Header';

interface Props extends ThemeProps {
  className?: string;
}

function AddAccountMenu({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <>
      <Header
        showBackArrow
        showHelp
        text={t<string>('Add Account')}
      />
      <div className={className}>
        <div className='add-account-menu'>
          <MenuCard
            description='Generate a new public address'
            title='Create a new account'
          />
        </div>
      </div>
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
      &::-webkit-scrollbar {
    display: none;
  }
  `
  )
);
