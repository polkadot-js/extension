// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon } from '@subwallet/react-ui';
import { LightbulbFilament } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  title: string,
  content: string
};

const Component: React.FC<Props> = ({ className, content, title }: Props) => {
  return (
    <div className={className}>
      <div className={'__title-wrapper'}>
        <Icon
          className={'__icon'}
          phosphorIcon={LightbulbFilament}
          weight={'fill'}
        />

        <div className={'__title'}>
          {title}
        </div>
      </div>

      <div className={'__content'}>{content}</div>
    </div>
  );
};

const NoteBox = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__title-wrapper': {
      display: 'flex',
      alignItems: 'center',
      marginBottom: token.marginXS
    },
    '.__icon': {
      color: token['gold-6'],
      fontSize: 24,
      width: 40,
      height: 40,
      justifyContent: 'center'
    },
    '.__title': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight3
    },
    '.__content': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      color: token.colorTextLight4
    }
  };
});

export default NoteBox;
