// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps{
  title: string;
  description: React.ReactNode;
  iconInstruction?: React.ReactNode;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, description, iconInstruction, title } = props;

  return (
    <>
      <div className={CN(className)}>
        {!!iconInstruction && <div className='__item-left-part'>{iconInstruction}</div>}
        <div className='__item-right-part'>
          <div className={'__item-title'}>{title}</div>
          <div className={'__item-description'}>{description}</div>
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
    backgroundColor: token.colorBgSecondary,

    '.__item-right-part': {
      paddingLeft: 10
    },

    '.__item-title': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      paddingBottom: token.paddingXXS
    },

    '.__item-description': {
      color: token.colorTextLight4,
      fontSize: token.fontSize,
      lineHeight: token.lineHeight
    }
  });
});

export default InstructionItem;
