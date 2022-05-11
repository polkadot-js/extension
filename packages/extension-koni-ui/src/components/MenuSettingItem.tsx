// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  children: React.ReactNode;
  className?: string;
  noBorder?: boolean;
  title?: React.ReactNode;
}

function MenuSettingItem ({ children, className = '', title }: Props): React.ReactElement<Props> {
  return (
    <div className={`${className}${title ? ' is-titled' : ''}`}>
      {title && (
        <div className='menu-setting-item__title'>{title}</div>
      )}
      {children}
    </div>
  );
}

export default styled(MenuSettingItem)(({ theme }: ThemeProps) => `
  min-width: 13rem;
  padding: 16px;
  max-width: 100%;

  > .menu-setting-item__title {
    margin: 0;
    width: 100%;
    font-size: ${theme.inputLabelFontSize};
    line-height: 14px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${theme.textColor};
    opacity: 0.65;
  }

  &+&.is-titled {
    margin-top: 16px;
  }
`);
