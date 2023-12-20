// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { migrateLocalStorage } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCircleRight, CheckCircle, X } from 'phosphor-react';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { goHome } = useDefaultNavigate();

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
      rightFooterButton={{
        children: t('Go to home'),
        onClick: goHome,
        icon: <Icon
          phosphorIcon={ArrowCircleRight}
          weight={'fill'}
        />
      }}
      showBackButton={true}
      subHeaderLeft={(
        <Icon
          phosphorIcon={X}
          size='md'
        />
      )}
      title={t('Successful')}
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
          {t('SubWallet MV3 is updated successfully!')}
        </div>
        <div className='description'>
          {t('Follow along with product updates or reach out if you have any questions.')}
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
