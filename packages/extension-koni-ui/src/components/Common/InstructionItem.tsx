// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps{
  title: string;
  description: React.ReactNode;
  iconInstruction: React.ReactNode;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, description, iconInstruction, title } = props;

  return (
    <>
      <div className={CN(className, 'item-instruction-container')}>
        <div className='item-left-part'>{iconInstruction}</div>
        <div className='item-right-part'>
          <div className={'item-title'}>{title}</div>
          <div className={'item-description'}>{description}</div>
        </div>
      </div>
    </>
  );
};

const InstructionItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    display: 'flex',
    alignItems: 'center',
    paddingRight: token.paddingSM,
    paddingLeft: token.paddingSM,
    paddingTop: 14,
    paddingBottom: 14,
    borderRadius: token.borderRadiusLG,
    backgroundColor: 'var(--Background-Secondary-background, #1A1A1A)',
    '.item-right-part': {
      paddingLeft: 10
    },
    '.item-title': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      paddingBottom: token.paddingXXS
    },
    '.item-description': {
      color: 'var(--white-text-white-45-secondary-text, rgba(255, 255, 255, 0.45))',
      fontSize: token.fontSize,
      lineHeight: token.lineHeight

    }
  });
});

export default InstructionItem;
