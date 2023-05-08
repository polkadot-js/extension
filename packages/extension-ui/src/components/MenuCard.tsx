// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { ThemeProps } from '../types';

interface Props extends ThemeProps {
  className?: string;
  preIcon?: React.ReactNode;
  title: string;
  description: string;
  extra?: React.ReactNode;
  onClick?: () => void;
  tabIndex?: number;
}

function MenuCard({
  className,
  description,
  extra,
  onClick,
  preIcon,
  tabIndex = 0,
  title
}: Props): React.ReactElement<Props> {
  return (
    <div
      className={className}
      onClick={onClick}
      onKeyPress={onClick}
      tabIndex={tabIndex}
    >
      <div
        className='flex-container'
      >
        {preIcon && <div className='icon'>{preIcon}</div>}
        <div className='flex-group'>
          <div className='title'>{title}</div>
          <div className='description'>{description}</div>
        </div>
        {extra && <div className='extra'>{extra}</div>}
      </div>
    </div>
  );
}

export default styled(MenuCard)(
  ({ onClick, theme }: Props) => `
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 16px;
  background: ${theme.menuBackground};
  border-radius: 8px;
  padding: 16px 16px 16px 24px;
  cursor: ${onClick ? 'pointer' : 'default'};
  transition: 0.2s ease;

  :hover, :focus {
    background: ${theme.editCardBackgroundHover};
  }


  .flex-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 28px;
  }

  .flex-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .icon {
    & img {
      width: 24px;
      height: 24px;
    }
  }
  .title {
    display: flex;
    font-family: ${theme.secondaryFontFamily};
    font-weight: 500;
    font-size: 14px;
    line-height: 120%;
    letter-spacing: 0.07em;
    }

  .description {
    display: flex;
    font-weight: 300;
    font-size: 14px;
    line-height: 145%;
    max-width: 230px;
    white-space: pre-line;
    color: ${theme.subTextColor};
  }

  & svg {
    fill: ${theme.primaryColor};
  }

  .extra {
    &:hover {
      cursor: pointer
    };
  }

  .icon {
    display: flex;
  }
`
);
