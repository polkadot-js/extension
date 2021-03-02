// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { InputFilter } from '@polkadot/extension-ui/components';

import useTranslation from '../../hooks/useTranslation';
import { Header } from '../../partials';
import Contact from './Contact';

interface Props extends ThemeProps {
  className?: string;
}

function Contacts ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');

  const _onChangeFilter = useCallback((filter: string) => {
    setFilter(filter);
  }, []);

  return (
    <>
      <Header
        showBackArrow
        showContactAdd
        smallMargin
        text={t<string>('Contacts')}
      />
      <>
        <InputFilter
          onChange={_onChangeFilter}
          placeholder={t<string>('Address or Nickname')}
          value={filter}
        />
        <div className={'contact-list'}>
          <Contact></Contact>
          <Contact></Contact>
          <Contact></Contact>
        </div>
      </>
    </>
  );
}

export default styled(Contacts)`
  height: 100%;
  overflow-y: auto;

  .contact-list {
    flex-direction: 'column';
  }

  .empty-list {
    text-align: center;
  }
`;
