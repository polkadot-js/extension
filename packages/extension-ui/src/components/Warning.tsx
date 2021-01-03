// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  children: React.ReactNode;
  className?: string;
  isBelowInput?: boolean;
  isDanger?: boolean;
}

function Warning ({ children, className = '', isBelowInput, isDanger }: Props): React.ReactElement<Props> {
  return (
    <div className={`${className} ${isDanger ? 'danger' : ''} ${isBelowInput ? 'belowInput' : ''}`}>
      <FontAwesomeIcon
        className='warningImage'
        icon={faExclamationTriangle}
      />
      <div className='warning-message'>{children}</div>
    </div>
  );
}

export default React.memo(styled(Warning)<Props>(({ isDanger, theme }: Props) => `
  display: flex;
  flex-direction: row;
  padding-left: 18px;
  color: ${theme.subTextColor};
  margin-right: 20px;
  margin-top: 6px;
  border-left: ${`0.25rem solid ${theme.iconWarningColor}`};

  &.belowInput {
    font-size: ${theme.labelFontSize};
    line-height: ${theme.labelLineHeight};

    &.danger {
      margin-top: -10px;
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
    margin: 5px 10px 5px 0;
    color: ${isDanger ? theme.iconDangerColor : theme.iconWarningColor};
  }
`));
