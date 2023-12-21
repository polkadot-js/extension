// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout, SocialGroup } from '@subwallet/extension-koni-ui/components';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { Button, ButtonProps, Icon, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { GlobeSimple, House } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

interface Props {
  className?: string;
}

function Component ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useTheme() as Theme;
  const { isWebUI } = useContext(ScreenContext);

  const goSecuritySetting = useCallback(() => {
    navigate('/settings/security');
  }, [navigate]);

  const footerBtn = useMemo((): ButtonProps => ({
    children: t('Back to Security settings'),
    icon: (
      <Icon
        phosphorIcon={House}
        weight='fill'
      />
    ),
    onClick: goSecuritySetting
  }), [goSecuritySetting, t]);

  return (
    <Layout.Base
      className={CN(className)}
      onBack={goSecuritySetting}
      rightFooterButton={!isWebUI ? footerBtn : undefined}
      showBackButton={isWebUI}
      subHeaderPaddingVertical={true}
      title={isWebUI ? t('Danger ahead!') : undefined}
    >
      <div className='title'>
        <PageIcon
          color={token.colorError}
          iconProps={{ phosphorIcon: GlobeSimple, weight: 'fill' }}
        />
      </div>
      <div className='sub-title h3-text'>{t('Danger ahead!')}</div>
      <div className='h5-text description'>{t('Attackers might trick you into doing something dangerous like installing software or revealing your personal information. Stay away from this page!')}</div>
      {
        isWebUI &&
        (
          <>
            <div className='button-container'>
              <Button
                block={true}
                {...footerBtn}
              />
            </div>
            <SocialGroup className={'social-group'} />
          </>
        )
      }
    </Layout.Base>
  );
}

const UnsafeAccess = styled(Component)<Props>(({ theme }) => {
  const { token } = theme as Theme;

  return ({
    '.ant-sw-screen-layout-body': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 128
    },

    '.web-ui-enable &': {
      '.ant-sw-screen-layout-body': {
        paddingTop: 112
      }
    },

    '.ant-sw-sub-header-title-content': {
      zIndex: 1
    },

    '.title': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center'
    },

    '.sub-title': {
      paddingTop: token.paddingXL,
      paddingBottom: token.padding,
      color: token.colorError
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
      marginTop: 44,
      width: 358
    }
  });
});

export default UnsafeAccess;
