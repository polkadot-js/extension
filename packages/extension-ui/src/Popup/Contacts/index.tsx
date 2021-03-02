// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React from 'react';
import styled from 'styled-components';

import useTranslation from '../../hooks/useTranslation';
import { Header } from '../../partials';
import Contact from './Contact';

interface Props extends ThemeProps {
  className?: string;
}

function Contacts ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <>
      <Header
        showBackArrow
        showContactAdd
        smallMargin
        text={t<string>('Contacts')}
      />
      <>
        <div className={className}>
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
  flex-direction: 'column';
`;
