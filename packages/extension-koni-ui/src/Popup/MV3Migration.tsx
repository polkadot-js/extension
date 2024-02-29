// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { migrateLocalStorage } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCircleRight, CheckCircle, X, XCircle } from 'phosphor-react';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const learnMore = useCallback(() => {
    window.open('https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3');
    setTimeout(() => {
      window.close();
    }, 300);
  }, []);

  const dismiss = useCallback(() => {
    window.close();
  }, []);

  const { t } = useTranslation();

  useEffect(() => {
    const jsonData = JSON.stringify(localStorage);

    migrateLocalStorage(jsonData)
      .then((rs) => {
        console.log('migrateLocalStorage', rs);
      })
      .catch(console.error);
  }, []);

  return (
    <Layout.WithSubHeaderOnly
      leftFooterButton={{
        children: t('Dismiss'),
        onClick: dismiss,
        schema: 'secondary',
        icon: <Icon
          phosphorIcon={XCircle}
          weight={'fill'}
        />
      }}
      rightFooterButton={{
        children: t('Learn more'),
        onClick: learnMore,
        icon: <Icon
          phosphorIcon={ArrowCircleRight}
          weight={'fill'}
        />
      }}
      showBackButton={false}
      subHeaderLeft={(
        <Icon
          phosphorIcon={X}
          size='md'
        />
      )}
      title={t('Update successful')}
    >
      <div className={CN(className)}>
        <div className='page-icon'>
          <PageIcon
            color='var(--page-icon-color)'
            iconProps={{
              weight: 'fill',
              phosphorIcon: CheckCircle
            }}
          />
        </div>
        <div className='title'>
          {t('Your SubWallet extension is updated to Manifest V3!')}
        </div>
        <div className='description'>
          {t('This update is required by Google, and helps improve the privacy, security, and performance of SubWallet extension.\n You can learn more details on Chrome for Developers, or safely dismiss this message.')}
        </div>
      </div>
    </Layout.WithSubHeaderOnly>
  );
};

const MV3Migration = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    textAlign: 'center',

    '.page-icon': {
      display: 'flex',
      justifyContent: 'center',
      marginTop: token.controlHeightLG,
      marginBottom: token.margin,
      '--page-icon-color': token.colorSecondary
    },

    '.title': {
      marginTop: token.margin,
      marginBottom: token.margin,
      fontWeight: token.fontWeightStrong,
      fontSize: token.fontSizeHeading3,
      lineHeight: token.lineHeightHeading3,
      color: token.colorTextBase
    },

    '.description': {
      padding: `0 ${token.controlHeightLG - token.padding}px`,
      marginTop: token.margin,
      marginBottom: token.margin * 2,
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      color: token.colorTextDescription,
      textAlign: 'center'
    }
  };
});

export default MV3Migration;
