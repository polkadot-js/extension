// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface Props extends ThemeProps {
  children: React.ReactNode;
  className?: string;
  isDanger?: boolean;
}

function Warning ({ children, className }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <div>
        <FontAwesomeIcon
          className='warningImage'
          icon={faExclamationTriangle}
        />
      </div>
      <div>{children}</div>
    </div>
  );
}

export default React.memo(styled(Warning)(({ isDanger, theme }: Props) => `
  display: flex;
  flex-direction: row;
  padding-left: ${isDanger ? '18px' : ''};
  color: ${theme.subTextColor};
  margin-right: 20px;
  border-left: ${isDanger ? `0.25rem solid ${theme.buttonBackgroundDanger}` : ''};

  .warningImage {
    margin: 5px 10px 5px 0;
    color: ${isDanger ? theme.iconDangerColor : theme.iconWarningColor};
  }
`));
