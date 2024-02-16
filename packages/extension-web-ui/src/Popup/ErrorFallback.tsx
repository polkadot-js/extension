// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PageWrapper } from '@subwallet/extension-web-ui/components';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import useDefaultNavigate from '@subwallet/extension-web-ui/hooks/router/useDefaultNavigate';
import { Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { House, Robot } from 'phosphor-react';
import React, { useContext } from 'react';
import { useRouteError } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import { ScreenContext } from '../contexts/ScreenContext';

type Props = ThemeProps;

function Component ({ className = '' }: Props) {
  const error = useRouteError();
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const goHome = useDefaultNavigate().goHome;

  const { isWebUI } = useContext(ScreenContext);

  console.error(error);

  return (
    <PageWrapper className={CN('main-page-container', className)}>
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
            <span>{t('Sorry, something went wrong.')}</span>
            <br />
            <span>{t('Please try again later.')}</span>
          </div>
        </div>

        <div className={'__footer-area'}>
          <Button
            block={true}
            icon={(
              <Icon
                className={'icon-submit'}
                phosphorIcon={House}
                weight='fill'
              />
            )}
            onClick={goHome}
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
    paddingLeft: token.padding,
    paddingRight: token.padding,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',

    '.container': {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      '&.__web-ui': {
        justifyContent: 'center',
        alignItems: 'center',

        '.__body-area': {
          flex: 0,
          padding: 0,
          marginBottom: 50
        },
        '.__footer-area': {
          minWidth: '50%'
        }
      }
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
      paddingTop: 128
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
      lineHeight: token.lineHeightLG
    },

    '.__footer-area': {
      paddingTop: token.padding,
      paddingBottom: token.paddingXL
    }
  });
});

export default ErrorFallback;
