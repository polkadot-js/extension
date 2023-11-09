// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useDefaultNavigate, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { Button, ButtonProps, Icon, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { GlobeSimple, House } from 'phosphor-react';
import React, { useContext, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

interface Props {
  className?: string;
}

function Component ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();
  const { token } = useTheme() as Theme;
  const { isWebUI } = useContext(ScreenContext);

  const footerBtn = useMemo((): ButtonProps => ({
    children: t('Back to home'),
    icon: (
      <Icon
        phosphorIcon={House}
        weight='fill'
      />
    ),
    onClick: goHome
  }), [goHome, t]);

  return (
    <Layout.Base
      className={CN(className)}
      rightFooterButton={!isWebUI ? footerBtn : undefined}
      showBackButton={false}
      subHeaderPaddingVertical={true}
    >
      <div className='title'>
        <div className='title-text'>4</div>
        <PageIcon
          color={token.blue}
          iconProps={{ phosphorIcon: GlobeSimple, weight: 'fill' }}
        />
        <div className='title-text'>4</div>
      </div>
      <div className='sub-title h3-text'>{t('Page not found')}</div>
      <div className='h5-text description'>{t('Your website URL is invalid')}</div>
      {
        isWebUI &&
          (
            <div className='button-container'>
              <Button
                block={true}
                {...footerBtn}
              />
            </div>
          )
      }
    </Layout.Base>
  );
}

const NotFoundContent = styled(Component)<Props>(({ theme }) => {
  const { token } = theme as Theme;

  return ({
    '.ant-sw-screen-layout-body': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 128
    },

    '.ant-sw-sub-header-title-content': {
      zIndex: 1
    },

    '.title': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center'
    },

    '.title-text': {
      color: token.blue,
      fontWeight: token.fontWeightStrong,
      fontSize: token.fontSizeSuper1,
      lineHeight: token.lineHeightSuper1,
      margin: `0 -${token.marginLG}px`
    },

    '.sub-title': {
      paddingTop: token.paddingXL,
      paddingBottom: token.padding,
      color: token.blue
    },

    '.description': {
      textAlign: 'center',
      paddingLeft: token.paddingXL,
      paddingRight: token.paddingXL,
      wordBreak: 'break-all',
      color: token.colorTextSecondary,
      fontWeight: token.bodyFontWeight
    },

    '.button-container': {
      marginTop: token.margin,
      width: 400
    }
  });
});

export default NotFoundContent;
