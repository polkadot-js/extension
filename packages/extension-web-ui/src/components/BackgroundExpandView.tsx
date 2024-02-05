// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useIsPopup } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { convertHexColorToRGBA, openInNewTab } from '@subwallet/extension-web-ui/utils';
import { Button, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { Question } from 'phosphor-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { Logo2D } from './Logo';
import PinExtensionMessage from './PinExtensionMessage';
import SocialButtonGroup from './SocialButtonGroup';

type Props = ThemeProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const location = useLocation();

  const isPopup = useIsPopup();

  const isShowFooter = useMemo(() => {
    const pathName = location.pathname;

    console.log(pathName);

    return !['/create-done'].includes(pathName);
  }, [location.pathname]);

  const isShowNotification = useMemo(() => {
    const pathName = location.pathname;

    return ['/create-done'].includes(pathName);
  }, [location.pathname]);

  if (isPopup) {
    return null;
  }

  return (
    <div className={CN(className)}>
      <div className='expand-view-header'>
        <div className='logo-container'>
          <Logo2D />
        </div>
        <div className='help-container'>
          <Button
            icon={<Icon phosphorIcon={Question} />}
            onClick={openInNewTab('https://docs.subwallet.app/')}
            size='xs'
            type='ghost'
          >
            {t('Help')}
          </Button>
        </div>
        {
          isShowNotification && (
            <div className='message-container'>
              <PinExtensionMessage />
            </div>
          )
        }
      </div>
      {
        isShowFooter && (
          <div className='expand-view-footer'>
            <SocialButtonGroup />
          </div>
        )
      }
    </div>
  );
};

const BackgroundExpandView = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    width: '100%',
    height: '100%',
    position: 'fixed',
    top: '0',
    left: '0',
    zIndex: -1,

    '.expand-view-header': {
      height: 331,
      background: `linear-gradient(180deg, ${convertHexColorToRGBA(token.colorPrimary, 0.1)} 17.49%, ${convertHexColorToRGBA(token['gray-6'], 0)} 100%)`
    },

    '.logo-container': {
      position: 'fixed',
      left: token.sizeLG,
      top: token.sizeXL - 1,
      color: token.colorWhite
    },

    '.help-container': {
      position: 'fixed',
      right: token.sizeLG,
      top: token.sizeLG,

      '.ant-btn': {
        padding: 0
      }
    },

    '.message-container': {
      position: 'fixed',
      right: token.sizeMD,
      top: token.sizeMD
    },

    '.expand-view-footer': {
      position: 'fixed',
      width: '100%',
      bottom: token.controlHeightLG,
      left: '0',
      zIndex: -1,

      '@media (max-height: 864px)': { // 600 + 2 * (52 + 40 * 2)
        display: 'none'
      }
    }
  };
});

export default BackgroundExpandView;
