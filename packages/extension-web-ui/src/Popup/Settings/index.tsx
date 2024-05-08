// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import DefaultLogosMap from '@subwallet/extension-web-ui/assets/logo';
import SwLogosMap from '@subwallet/extension-web-ui/assets/subwallet';
import { BaseModal, PageWrapper } from '@subwallet/extension-web-ui/components';
import { EXTENSION_VERSION, SUPPORT_MAIL, TERMS_OF_SERVICE_URL, TWITTER_URL, WEB_BUILD_NUMBER, WEBSITE_URL, WIKI_URL } from '@subwallet/extension-web-ui/constants/common';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { WebUIContext } from '@subwallet/extension-web-ui/contexts/WebUIContext';
import useNotification from '@subwallet/extension-web-ui/hooks/common/useNotification';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import useUILock from '@subwallet/extension-web-ui/hooks/common/useUILock';
import useIsPopup from '@subwallet/extension-web-ui/hooks/dom/useIsPopup';
import useDefaultNavigate from '@subwallet/extension-web-ui/hooks/router/useDefaultNavigate';
import { windowOpen } from '@subwallet/extension-web-ui/messaging';
import { Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { openInNewTab } from '@subwallet/extension-web-ui/utils';
import { BackgroundIcon, Button, ButtonProps, Icon, Image, ModalContext, SettingItem, SwHeader, SwIconProps } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowsOut, ArrowSquareOut, Book, BookBookmark, CaretRight, ChatTeardropText, Coin, EnvelopeSimple, FrameCorners, Globe, GlobeHemisphereEast, Lock, ShareNetwork, ShieldCheck, X } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps

type SettingItemType = {
  key: string,
  leftIcon: SwIconProps['phosphorIcon'] | React.ReactNode,
  leftIconBgColor: string,
  rightIcon: SwIconProps['phosphorIcon'],
  title: string,
  onClick?: () => void,
  isHidden?: boolean,
};

type SettingGroupItemType = {
  key: string,
  label?: string,
  items: SettingItemType[],
};

const isReactNode = (element: unknown): element is React.ReactNode => {
  return React.isValidElement(element);
};

function generateLeftIcon (backgroundColor: string, icon: SwIconProps['phosphorIcon'] | React.ReactNode): React.ReactNode {
  const isNode = isReactNode(icon);

  return (
    <BackgroundIcon
      backgroundColor={backgroundColor}
      customIcon={isNode ? icon : undefined}
      phosphorIcon={isNode ? undefined : icon}
      size='sm'
      type={isNode ? 'customIcon' : 'phosphor'}
      weight='fill'
    />
  );
}

function generateRightIcon (icon: SwIconProps['phosphorIcon']): React.ReactNode {
  return (
    <Icon
      className='__right-icon'
      customSize={'20px'}
      phosphorIcon={icon}
      type='phosphor'
    />
  );
}

const modalId = 'about-subwallet-modal';

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const navigate = useNavigate();
  const { token } = useTheme() as Theme;
  const isPopup = useIsPopup();
  const notify = useNotification();
  const location = useLocation();
  const { goHome } = useDefaultNavigate();
  const { t } = useTranslation();
  const [locking, setLocking] = useState(false);
  const { isWebUI } = useContext(ScreenContext);
  const { setTitle } = useContext(WebUIContext);
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { isUILocked, lock, unlock } = useUILock();

  const onLock = useCallback(() => {
    if (isUILocked) {
      unlock();
      goHome();
    } else {
      setLocking(true);
      lock()
        .then(() => {
          goHome();
        })
        .catch((e: Error) => {
          notify({
            message: e.message,
            type: 'error'
          });
        }).finally(() => {
          setLocking(false);
        });
    }
  }, [goHome, isUILocked, lock, notify, unlock]);

  // todo: i18n all titles, labels below
  const SettingGroupItemType = useMemo((): SettingGroupItemType[] => ([
    {
      key: 'general',
      items: [
        {
          key: 'expand-view',
          leftIcon: FrameCorners,
          leftIconBgColor: token.colorPrimary,
          rightIcon: ArrowsOut,
          title: t('Expand view'),
          onClick: () => {
            windowOpen({ allowedPath: '/' }).catch(console.error);
          },
          isHidden: !isPopup
        },
        {
          key: 'general-settings',
          leftIcon: GlobeHemisphereEast,
          leftIconBgColor: token['magenta-6'],
          rightIcon: CaretRight,
          title: t('General settings'),
          onClick: () => {
            navigate('/settings/general');
          }
        },
        {
          key: 'security-settings',
          leftIcon: ShieldCheck,
          leftIconBgColor: token['green-6'],
          rightIcon: CaretRight,
          title: t('Security settings'),
          onClick: () => {
            navigate('/settings/security', { state: true });
          }
        }
      ]
    },
    {
      key: 'assets-&-addresses',
      label: t('Assets & addresses'),
      items: [
        {
          key: 'manage-networks',
          leftIcon: ShareNetwork,
          leftIconBgColor: token['purple-7'],
          rightIcon: CaretRight,
          title: t('Manage networks'),
          onClick: () => {
            navigate('/settings/chains/manage');
          }
        },
        {
          key: 'manage-tokens',
          leftIcon: Coin,
          leftIconBgColor: token['gold-6'],
          rightIcon: CaretRight,
          title: t('Manage tokens'),
          onClick: () => {
            navigate('/settings/tokens/manage');
          }
        },
        {
          key: 'manage-address-book',
          leftIcon: BookBookmark,
          leftIconBgColor: token['blue-6'],
          rightIcon: CaretRight,
          title: t('Manage address book'),
          onClick: () => {
            navigate('/settings/address-book');
          }
        }
      ]
    },
    {
      key: 'networks-&-tokens',
      label: t('COMMUNITY & SUPPORT'),
      items: [
        {
          key: 'contact-support',
          leftIcon: EnvelopeSimple,
          leftIconBgColor: token['geekblue-6'],
          rightIcon: ArrowSquareOut,
          title: t('Contact support'),
          onClick: () => {
            window.open(`${SUPPORT_MAIL}?subject=[WebApp - In-app support]`, '_self');
          }
        },
        {
          key: 'user-manual',
          leftIcon: Book,
          leftIconBgColor: token['green-6'],
          rightIcon: ArrowSquareOut,
          title: t('User guide'),
          onClick: openInNewTab(WIKI_URL)
        },
        {
          key: 'request-a-feature',
          leftIcon: ChatTeardropText,
          leftIconBgColor: token['magenta-7'],
          rightIcon: ArrowSquareOut,
          title: t('Request a feature'),
          onClick: () => {
            window.open(`${SUPPORT_MAIL}?subject=[SubWallet In-app Feedback]`, '_self');
          }
        },
        {
          key: 'about-subwallet',
          leftIcon: (
            <Image
              className='__subwallet-logo'
              height={24}
              shape='squircle'
              src={SwLogosMap.subwallet}
              width={24}
            />
          ),
          leftIconBgColor: 'transparent',
          rightIcon: CaretRight,
          title: t('About SubWallet'),
          onClick: () => {
            activeModal(modalId);
          }
        }

      ]
    }
  ]), [activeModal, isPopup, navigate, t, token]);

  const aboutSubwalletType = useMemo<SettingItemType[]>(() => {
    return [
      {
        key: 'website',
        leftIcon: Globe,
        rightIcon: ArrowSquareOut,
        leftIconBgColor: token['purple-7'],
        title: t('Website'),
        onClick: openInNewTab(WEBSITE_URL)
      },
      {
        key: 'terms-of-use',
        leftIcon: BookBookmark,
        rightIcon: ArrowSquareOut,
        leftIconBgColor: token['volcano-7'],
        title: t('Terms of use'),
        onClick: openInNewTab(TERMS_OF_SERVICE_URL)
      },
      {
        key: 'x',
        leftIcon: (
          <Image
            height={24}
            shape='squircle'
            src={DefaultLogosMap.xtwitter}
            width={24}
          />
        ),
        rightIcon: ArrowSquareOut,
        leftIconBgColor: token.colorBgSecondary,
        title: t('X (Twitter)'),
        onClick: openInNewTab(TWITTER_URL)
      }
    ];
  }, [t, token]);

  const headerIcons = useMemo<ButtonProps[]>(() => {
    return [
      {
        icon: (
          <Icon
            customSize={'24px'}
            phosphorIcon={X}
            type='phosphor'
            weight={'bold'}
          />
        ),
        onClick: goHome
      }
    ];
  }, [goHome]);

  useEffect(() => {
    if (location.pathname === '/settings' || location.pathname === '/settings/list') {
      setTitle(t('Settings'));
    }
  }, [location.pathname, setTitle, t]);

  const closeModal = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  return (
    <PageWrapper className={`settings ${className}`}>
      <>
        {!isWebUI && (
          <SwHeader
            left='logo'
            onClickLeft={goHome}
            paddingVertical
            rightButtons={headerIcons}
            showLeftButton={true}
          >
            {t('Settings')}
          </SwHeader>
        )}

        <div className={'__content-container'}>
          {
            SettingGroupItemType.map((group) => {
              return (
                <div
                  className={'__group-container'}
                  key={group.key}
                >
                  {!!group.label && (<div className='__group-label'>{group.label}</div>)}

                  <div className={'__group-content'}>
                    {group.items.map((item) => item.isHidden
                      ? null
                      : (
                        <SettingItem
                          className={'__setting-item'}
                          key={item.key}
                          leftItemIcon={generateLeftIcon(item.leftIconBgColor, item.leftIcon)}
                          name={item.title}
                          onPressItem={item.onClick}
                          rightItem={generateRightIcon(item.rightIcon)}
                        />
                      ))}
                  </div>
                </div>
              );
            })
          }

          <Button
            block
            icon={
              <Icon
                phosphorIcon={Lock}
                type='phosphor'
                weight={'fill'}
              />
            }
            loading={locking}
            onClick={onLock}
            schema={'secondary'}
          >
            {t('Lock')}
          </Button>

          <div className={'__version'}>
          SubWallet v {EXTENSION_VERSION} - {WEB_BUILD_NUMBER}
          </div>
        </div>

        <Outlet />
        <BaseModal
          className={CN(className, 'about-subwallet-modal')}
          id={modalId}
          onCancel={closeModal}
          title={t('About SubWallet')}
        >
          {aboutSubwalletType.map((item) => (
            <div
              className='about-subwallet-item'
              key={item.key}
            >
              <div className=''>
                <SettingItem
                  className='__setting-about-item setting-item'
                  key={item.key}
                  leftItemIcon={generateLeftIcon(item.leftIconBgColor, item.leftIcon)}
                  name={item.title}
                  onPressItem={item.onClick}
                  rightItem={generateRightIcon(item.rightIcon)}
                />
              </div>
            </div>
          ))}
        </BaseModal>
      </>
    </PageWrapper>
  );
}

export const Settings = styled(Component)<Props>(({ theme: { extendToken, token } }: Props) => {
  return ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',

    '.ant-sw-header-container': {
      backgroundColor: token.colorBgDefault,
      minHeight: 'auto',
      position: 'sticky',
      top: 0,
      zIndex: 10
    },

    '.web-ui-enable &, .web-ui-enable & .ant-sw-header-container': {
      backgroundColor: 'transparent'
    },

    '.ant-sw-header-center-part': {
      color: token.colorTextLight1,
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4,
      fontWeight: token.headingFontWeight
    },

    '.custom-header': {
      paddingTop: token.paddingLG,
      paddingBottom: token.paddingLG
    },

    '.__content-container': {
      paddingTop: token.padding,
      paddingRight: token.padding,
      paddingLeft: token.padding,
      paddingBottom: token.paddingLG,

      '.web-ui-enable &': {
        paddingTop: 0,
        paddingBottom: token.paddingLG,
        margin: '0 auto',
        width: extendToken.bigOneColumnWidth,
        maxWidth: '100%'
      }
    },

    '.__group-label': {
      color: token.colorTextLight3,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      marginBottom: token.margin,
      textTransform: 'uppercase'
    },

    '.__group-container': {
      paddingBottom: token.paddingLG
    },

    '.__setting-item + .__setting-item': {
      marginTop: token.marginXS
    },

    '.ant-web3-block-right-item': {
      minWidth: 40,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: -token.marginXS,
      color: token['gray-4']
    },

    '.__setting-item:hover .ant-web3-block-right-item': {
      color: token['gray-6']
    },

    '.__version': {
      paddingTop: token.padding,
      textAlign: 'center',
      color: token.colorTextLight3,
      fontSize: token.size,
      lineHeight: token.lineHeight
    },
    '.__subwallet-logo': {
      borderRadius: '50%'
    },
    '.about-subwallet-item': {
      marginBottom: 8
    }
  });
});

export default Settings;
