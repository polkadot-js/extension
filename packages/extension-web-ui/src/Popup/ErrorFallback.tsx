// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { reportError } from '@subwallet/extension-base/utils/reportError';
import { PageWrapper } from '@subwallet/extension-web-ui/components';
import { useNotification } from '@subwallet/extension-web-ui/hooks';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import useDefaultNavigate from '@subwallet/extension-web-ui/hooks/router/useDefaultNavigate';
import { Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { House, Robot, Share } from 'phosphor-react';
import React, { useCallback, useContext, useState } from 'react';
import { useLocation, useRouteError } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import { ScreenContext } from '../contexts/ScreenContext';

type Props = ThemeProps;

function Component ({ className = '' }: Props) {
  const error = useRouteError();
  const location = useLocation();
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const goHome = useDefaultNavigate().goHome;

  const { isWebUI } = useContext(ScreenContext);
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
      <div className={'web-layout-background'}></div>
      {isWebUI ? (<div className={'__header-area'}>{t('Unknown error')}</div>) : (undefined)}
      <div className={CN('container', {
        '__web-ui': isWebUI
      })}
      >
        <div className={'__body-area'}>
          <PageIcon
            color={token.colorError}
            iconProps={{
              phosphorIcon: Robot
            }}
          />
          <div className={'__title'}>{t('Opps! An Error Occurred')}</div>
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

      </div>
    </PageWrapper>
  );
}

const ErrorFallback = styled(Component)<Props>(({ theme: { extendToken, token } }: Props) => {
  return ({
    backgroundColor: token.colorBgDefault,
    display: 'flex',
    flexDirection: 'column',
    '.__header-area': {
      display: 'flex',
      width: '100%',
      justifyContent: 'center',
      fontSize: token.fontSizeHeading2,
      fontWeight: token.fontWeightStrong,
      lineHeight: token.lineHeightHeading2,
      paddingTop: 24,
      paddingRight: 24,
      paddingBottom: 48,
      paddingLeft: 24
    },
    '.container': {
      display: 'flex',
      flexDirection: 'column',
      '.__body-area': {
        flex: 0,
        padding: 0,
        marginBottom: 44,
        paddingTop: 128
      },
      '&.__web-ui': {
        justifyContent: 'center',
        alignItems: 'center',

        '.__body-area': {
          flex: 0,
          padding: 0,
          marginBottom: 44,
          paddingTop: 112
        },
        '.__footer-area': {
          width: 682
        }
      }
    },

    '.web-layout-background': {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1,
      transitionDuration: 'background-color 0.3s ease',
      background: 'linear-gradient(180deg, rgba(234, 76, 76, 0.10) 5%, rgba(217, 217, 217, 0.00) 33%)'
    },

    '.__body-area': {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    },

    '.__title': {
      color: token.colorError,
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4,
      fontWeight: token.headingFontWeight,
      marginTop: token.marginXL,
      marginBottom: token.margin
    },

    '.__content': {
      color: token.colorTextLight3,
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      paddingLeft: token.padding,
      paddingRight: token.padding
    },

    '.__footer-area': {
      display: 'flex',
      paddingTop: token.padding,
      paddingBottom: token.paddingXL,
      flexDirection: 'column',
      gap: token.paddingSM,
      paddingRight: token.padding,
      paddingLeft: token.padding
    }
  });
});

export default ErrorFallback;
