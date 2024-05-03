// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { detectTranslate } from '@subwallet/extension-base/utils';
import { useNotification } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { ActivityIndicator, PageIcon } from '@subwallet/react-ui';
import { MagnifyingGlass } from 'phosphor-react';
import React, { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  validatorTitle: string,
  onClickReload: (val: boolean) => void,
  isDataEmpty: boolean
}

const Component: React.FC<Props> = ({ className, isDataEmpty, onClickReload, validatorTitle }: Props) => {
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
      {
        isDataEmpty
          ? (
            <div className={'data-empty-msg'}>
              <div className='description'>
                {t('Reload to fetch {{value}} information', { replace: { value: validatorTitle } })}
              </div>
              <div className={'description'}>
                <Trans
                  components={{
                    highlight: (
                      <span
                        className={'reload-text'}
                        onClick={handleReload}
                      />
                    )
                  }}
                  i18nKey={detectTranslate('Please <highlight>reload</highlight>')}
                />
              </div>
            </div>
          )
          : (
            <div className='description'>
              {t('Please change your search criteria try again')}
            </div>
          )
      }
    </div>
  );
};

const EmptyValidator = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '--icon-color': token['gray-4'],
    paddingTop: token.padding,
    marginTop: token.margin * 3,
    paddingBottom: token.padding,
    marginBottom: token.margin * 3,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',

    '.data-empty-msg': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    },

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
