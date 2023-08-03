// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useNotification } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ActivityIndicator, PageIcon } from '@subwallet/react-ui';
import { MagnifyingGlass } from 'phosphor-react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  validatorTitle: string,
  onClickReload: (val: boolean) => void
}

const Component: React.FC<Props> = ({ className, onClickReload, validatorTitle }: Props) => {
  const { t } = useTranslation();
  const notify = useNotification();

  const handleReload = useCallback(() => {
    notify({
      icon: <ActivityIndicator size={32} />,
      style: { top: 210 },
      direction: 'vertical',
      duration: 1.8,
      closable: false,
      message: t('Reloading')
    });
    onClickReload(true);
  }, [notify, onClickReload, t]);

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
        {t('No results found')}
      </div>
      <div className='description'>
        {t('Unable to fetch {{value}} information', { replace: { value: validatorTitle } })}
      </div>
      <div className={'description'}>
        <span
          className={'reload-text'}
          onClick={handleReload}
        >
          {t('Reload')}
        </span>
        <span> {t('and try again')}</span>
      </div>
    </div>
  );
};

const EmptyValidator = styled(Component)<Props>(({ theme: { token } }: Props) => {
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
      lineHeight: token.lineHeightHeading5,
      paddingTop: token.padding
    },

    '.description': {
      color: token.colorTextDescription,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6
    },

    '.reload-text': {
      color: token.geekblue,
      textDecoration: 'underline',
      cursor: 'pointer',
      fontWeight: token.headingFontWeight
    }
  };
});

export default EmptyValidator;
