// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import PageIcon from '@subwallet/react-ui/lib/page-icon';
import { MagnifyingGlass } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps;

const Component: React.FC<Props> = ({ className }: Props) => {
  return (
    <div className={className}>
      <PageIcon
        color='var(--icon-color)'
        iconProps={{
          type: 'phosphor',
          phosphorIcon: MagnifyingGlass,
          weight: 'fill'
        }}
      />
      <div className='message'>
        No results found
      </div>
      <div className='description'>
        Please change your search criteria try again
      </div>
    </div>
  );
};

const SelectAccountEmpty = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '--icon-color': token['gray-4'],
    paddingTop: token.padding,
    marginTop: token.margin * 3,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',

    '.message': {
      color: token.colorTextHeading,
      fontWeight: token.headingFontWeight,
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5
    },

    '.description': {
      color: token.colorTextDescription,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6
    }
  };
});

export default SelectAccountEmpty;
