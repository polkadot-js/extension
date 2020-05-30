// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

import warningImageSrc from '../assets/warning.svg';
import Svg from './Svg';

interface Props extends ThemeProps {
  children: React.ReactNode;
  danger?: boolean;
  className?: string;
}

function Warning ({ children, className }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <div>
        <Svg
          className='warningImage'
          src={warningImageSrc}
        />
      </div>
      <div>{children}</div>
    </div>
  );
}

export default React.memo(styled(Warning)`
  display: flex;
  flex-direction: row;
  padding-left: ${({ danger }): string => danger ? '18px' : ''};
  color: ${({ theme }: Props): string => theme.subTextColor};
  margin-right: 20px;
  border-left: ${({ danger, theme }: Props): string => danger ? `0.25rem solid ${theme.buttonBackgroundDanger}` : ''};

  .warningImage {
    width: 16px;
    height: 14px;
    margin: 5px 10px 5px 0;
    background: ${({ danger, theme }: Props): string => danger ? theme.iconDangerColor : theme.iconWarningColor};
  }
`);
