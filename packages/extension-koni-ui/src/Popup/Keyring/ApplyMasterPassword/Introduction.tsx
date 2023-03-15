// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { ShieldStar } from 'phosphor-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { t } = useTranslation();

  return (
    <div className={CN(className)}>
      <div className='page-icon'>
        <PageIcon
          color='var(--page-icon-color)'
          iconProps={{
            weight: 'fill',
            phosphorIcon: ShieldStar
          }}
        />
      </div>
      <div className='title'>
        {t('Apply master password')}
      </div>
      <div className='description'>
        {t('Master password created successfully. Please apply the master password to your existing accounts')}
      </div>
    </div>
  );
};

const IntroductionMigratePassword = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    padding: `0 ${token.padding}px`,
    textAlign: 'center',

    '.page-icon': {
      display: 'flex',
      justifyContent: 'center',
      marginTop: token.margin,
      '--page-icon-color': token.colorSecondary
    },

    '.title': {
      marginTop: token.margin,
      marginBottom: token.margin,
      fontWeight: token.fontWeightStrong,
      fontSize: token.fontSizeHeading3,
      lineHeight: token.lineHeightHeading3,
      color: token.colorText
    },

    '.description': {
      padding: `0 ${token.controlHeightLG - token.padding}px`,
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      color: token.colorTextDescription,
      textAlign: 'center'
    },

    '.form-item-no-error': {
      '.ant-form-item-explain': {
        display: 'none'
      }
    }
  };
});

export default IntroductionMigratePassword;
