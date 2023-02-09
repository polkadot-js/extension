// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React from 'react';
import styled from 'styled-components';

import useTranslation from '../../hooks/useTranslation';
import Header from '../../partials/Header';

interface Props extends ThemeProps {
  className?: string;
}

function SafetyLink({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <>
      <Header
        text={t<string>('SafetyLink')}
        withBackArrow
        withHelp
      />
      {/* TODO: */}
      <div className={className}>PLACEHOLDER</div>
    </>
  );
}

export default React.memo(
  styled(SafetyLink)(
    ({ theme }: Props) => `
  color: ${theme.textColor};
  height: 100%;
  overflow-y: scroll;
  scrollbar-width: none;
      
  &::-webkit-scrollbar {
    display: none;
  }
  `
  )
);
