// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { reportError } from '@subwallet/extension-base/utils/reportError';
import { PageWrapper } from '@subwallet/extension-koni-ui/components';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, PageIcon, SwHeader } from '@subwallet/react-ui';
import CN from 'classnames';
import { House, Robot, Share } from 'phosphor-react';
import React, { useCallback, useState } from 'react';
import { useLocation, useRouteError } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import useNotification from '../hooks/common/useNotification';

type Props = ThemeProps;

function Component ({ className = '' }: Props) {
  const error = useRouteError();
  const location = useLocation();
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const goHome = useDefaultNavigate().goHome;
  const [isUploading, setIsUploading] = useState(false);
  const notify = useNotification();

  const uploadCrashLog = useCallback(() => {
    setIsUploading(true);
    reportError(error as Error, location.pathname)
      .catch(() => notify({
        message: 'Failed to send report',
        type: 'error'
      }))
      .finally(() => {
        setIsUploading(false);
        goHome();
      });
  }, [error, goHome, location.pathname, notify]);

  return (
    <PageWrapper className={CN('main-page-container', className)}>
      <SwHeader
        className={'error-fallback-header'}
      >
        {t('Unknown error')}
      </SwHeader>
      <div className={'__body-area'}>
        <PageIcon
          color={token.colorError}
          iconProps={{
            phosphorIcon: Robot
          }}
        />
        <div className={'__title'}>{t('Oops, an error occurred!')}</div>
        <div className={'__content'}>
          <span>{t('Something went wrong. Help us fix the problem by sending a report anonymously!')}</span>
        </div>
      </div>

      <div className={'__footer-area'}>
        <Button
          block={true}
          icon={(
            <Icon
              className={'icon-submit'}
              phosphorIcon={Share}
              weight='fill'
            />
          )}
          loading={isUploading}
          onClick={uploadCrashLog}
        >
          {t('Send report')}
        </Button>
        <Button
          block={true}
          disabled={isUploading}
          icon={(
            <Icon
              className={'icon-submit'}
              phosphorIcon={House}
              weight='fill'
            />
          )}
          onClick={goHome}
          schema={'secondary'}
        >
          {t('Back to home')}
        </Button>
      </div>
    </PageWrapper>
  );
}

const ErrorFallback = styled(Component)<Props>(({ theme: { extendToken, token } }: Props) => {
  return ({
    backgroundColor: token.colorBgDefault,
    paddingLeft: token.padding,
    paddingRight: token.padding,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',

    '.ant-sw-header-container': {
      paddingTop: token.padding,
      paddingBottom: token.padding,
      backgroundColor: 'transparent'
    },

    '.ant-sw-header-center-part': {
      color: token.colorTextLight1,
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4
    },

    '&:before': {
      content: '""',
      backgroundImage: extendToken.tokensScreenDangerBackgroundColor,
      height: 180,
      position: 'absolute',
      display: 'block',
      top: 0,
      left: 0,
      right: 0
    },

    '.__body-area': {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      paddingTop: 50
    },

    '.__title': {
      color: token.colorError,
      fontSize: token.fontSizeHeading3,
      lineHeight: token.lineHeightHeading3,
      fontWeight: token.headingFontWeight,
      marginTop: token.marginLG,
      marginBottom: token.margin
    },

    '.__content': {
      color: token.colorTextLight4,
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      fontWeight: token.bodyFontWeight
    },

    '.__footer-area': {
      display: 'flex',
      paddingTop: token.padding,
      paddingBottom: token.paddingXL,
      flexDirection: 'column',
      gap: token.paddingSM
    }
  });
});

export default ErrorFallback;
