// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BackgroundExpandView, Layout } from '@subwallet/extension-koni-ui/components';
import { useDefaultNavigate, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { passPhishingPage } from '@subwallet/extension-koni-ui/messaging';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { noop } from '@subwallet/extension-koni-ui/utils';
import { ButtonProps, Icon, PageIcon, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import { ShieldSlash, XCircle } from 'phosphor-react';
import React, { useCallback } from 'react';
import { useParams } from 'react-router';
import styled, { useTheme } from 'styled-components';

interface Props {
  className?: string;
}

function _PhishingDetected ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();
  const { token } = useTheme() as Theme;
  const website = useParams<{ website: string }>().website || '';
  const decodedWebsite = decodeURIComponent(website);

  const footerBtn: ButtonProps = {
    children: t('Get me out of here'),
    icon: <Icon
      phosphorIcon={XCircle}
      weight='fill'
    />,
    onClick: goHome
  };

  const onTrustSite = useCallback(() => {
    passPhishingPage(decodedWebsite)
      .then(() => {
        location.replace(decodedWebsite);
      })
      .catch(noop);
  }, [decodedWebsite]);

  return (
    <Layout.WithSubHeaderOnly
      className={CN(className)}
      rightFooterButton={footerBtn}
      showBackButton={false}
      subHeaderPaddingVertical={true}
      title={t('Phishing detection')}
    >
      <div className={CN('__upper-block-wrapper')} />
      <PageIcon
        color={token.colorError}
        iconProps={{ phosphorIcon: ShieldSlash, weight: 'fill' }}
      />
      <div className='title h3-text text-danger'>{t('Phishing detection')}</div>
      <div className='h4-text text-danger website-url'>{decodedWebsite}</div>
      <div className='phishing-detection-message'>
        <span>{t('This domain has been reported as a known phishing site on a community maintained list:')}&nbsp;</span>
        <Typography.Link
          href='https://polkadot.js.org/phishing/#'
          size='lg'
        >
          {t('view full list')}
        </Typography.Link>
      </div>
      <div
        className='trust-site'
        onClick={onTrustSite}
      >
        {t('I trust this site')}
      </div>
      <BackgroundExpandView />
    </Layout.WithSubHeaderOnly>
  );
}

const PhishingDetected = styled(_PhishingDetected)<Props>(({ theme }) => {
  const { extendToken, token } = theme as Theme;

  return ({
    position: 'relative',
    border: `1px solid ${token.colorBgInput}`,

    '.ant-sw-screen-layout-body': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 48
    },

    '.ant-sw-sub-header-title-content': {
      zIndex: 1
    },

    '.title': {
      paddingTop: 16,
      paddingBottom: 16
    },

    '.phishing-detection-message': {
      paddingLeft: 40,
      paddingRight: 40,
      paddingTop: 16,
      textAlign: 'center',
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight3,
      marginBottom: token.margin
    },

    '.trust-site': {
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextLight5,
      cursor: 'pointer',

      '&:hover': {
        color: token.colorTextLight2
      }
    },

    '.__upper-block-wrapper': {
      position: 'absolute',
      height: 180,
      top: 0,
      left: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      transaction: '0.1s height',
      backgroundImage: extendToken.tokensScreenDangerBackgroundColor
    },

    '.website-url': {
      textAlign: 'center',
      paddingLeft: token.paddingXL,
      paddingRight: token.paddingXL,
      wordBreak: 'break-all'
    }
  });
});

export default PhishingDetected;
