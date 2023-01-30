// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { ThemeProps } from '../types';

interface Props extends ThemeProps {
  className?: string;
  title: string;
  description: string;
  extra?: React.ReactNode;
}

function MenuCard({className, description, extra, title }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <div className='flex-group'>
      <div className='title'>{title}</div>
      <div className='description'>{description}</div>
      </div>
      {extra && <div className='extra'>{extra}</div>}
    </div>
  );
}

export default styled(MenuCard)(({ theme }: Props) => `
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 16px;
  height: 74px;
  background: ${theme.menuBackground};
  border-radius: 8px;
  
  .border {
    border: 1px solid red;
  }

  .flex-group {
    display: flex;
    flex-direction: column;
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
`
);
