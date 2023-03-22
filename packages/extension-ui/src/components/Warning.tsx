// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

import warningSign from '../assets/warningSign.svg';

interface Props extends ThemeProps {
  children: React.ReactNode;
  className?: string;
  isBelowInput?: boolean;
  isDanger?: boolean;
}

function Warning({ children, className = '', isBelowInput, isDanger }: Props): React.ReactElement<Props> {
  return (
    <div className={`${className} ${isDanger ? 'danger' : ''} ${isBelowInput ? 'belowInput' : ''}`}>
      <img
        className='warningImage'
        src={warningSign}
      />
      <div className='warning-message'>{children}</div>
    </div>
  );
}

export default React.memo(
  styled(Warning)<Props>(
    ({ isDanger, theme }: Props) => `
  display: flex;
  flex-direction: row;
  color: ${theme.textColorDanger};
  margin-left: 16px;
  margin-top: 6px;

  &.belowInput {
    font-size: ${theme.labelFontSize};
    line-height: ${theme.labelLineHeight};

    &.danger {
      margin-top: -12px;
      margin-bottom: 4px;
    }
  }

  &.danger {
    border-left-color: ${theme.buttonBackgroundDanger};
  }

  .warning-message {
    display: flex;
    align-items: center;
  }

  .warningImage {
    margin: 5px 4px 5px 0;
    color: ${isDanger ? theme.iconDangerColor : theme.iconWarningColor};
  }
`
  )
);
