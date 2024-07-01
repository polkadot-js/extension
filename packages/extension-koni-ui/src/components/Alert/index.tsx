// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon } from '@subwallet/react-ui';
import { getAlphaColor } from '@subwallet/react-ui/lib/theme/themes/default/colorAlgorithm';
import CN from 'classnames';
import { Info } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  type?: 'info' | 'warning' | 'error';
  title: string;
  description: React.ReactNode;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, description, title, type = 'info' } = props;

  return (
    <div className={CN(className, `type-${type}`)}>
      <div className='alert-icon'>
        <BackgroundIcon
          backgroundColor='var(--bg-color)'
          iconColor='var(--icon-color)'
          phosphorIcon={Info}
          size='lg'
          weight='fill'
        />
      </div>
      <div className='alert-content'>
        <div className='alert-title'>{title}</div>
        <div className='alert-description'>{description}</div>
      </div>
    </div>
  );
};

const AlertBox = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    textAlign: 'start',
    backgroundColor: token.colorBgSecondary,
    borderRadius: token.borderRadiusLG,
    padding: `${token.paddingSM + 2}px ${token.paddingSM}px ${token.paddingSM + 2}px ${token.paddingSM}px`,
    display: 'flex',
    flexDirection: 'row',
    gap: token.sizeXS + 2,

    '.alert-icon': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center'
    },

    '.alert-content': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXXS
    },

    '.alert-title': {
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5
    },

    '.alert-description': {
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription
    },

    '&.type-info': {
      '--bg-color': getAlphaColor(token.colorPrimary, 0.1),
      '--icon-color': token.colorPrimary,

      '.alert-title': {
        color: token.colorTextBase
      }
    },

    '&.type-warning': {
      '--bg-color': getAlphaColor(token.colorWarning, 0.1),
      '--icon-color': token.colorWarning,

      '.alert-title': {
        color: token.colorWarning
      }
    },

    '&.type-error': {
      '--bg-color': getAlphaColor(token.colorError, 0.1),
      '--icon-color': token.colorError,

      '.alert-title': {
        color: token.colorError
      }
    }
  };
});

export default AlertBox;
