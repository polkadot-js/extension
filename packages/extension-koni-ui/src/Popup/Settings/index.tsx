// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import DefaultLogosMap from '@subwallet/extension-koni-ui/assets/logo';
import { PageWrapper, WalletConnect } from '@subwallet/extension-koni-ui/components';
import { EXTENSION_VERSION, SUPPORT_MAIL, TERMS_OF_SERVICE_URL, TWITTER_URL, WEBSITE_URL, WIKI_URL } from '@subwallet/extension-koni-ui/constants/common';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useUILock from '@subwallet/extension-koni-ui/hooks/common/useUILock';
import useIsPopup from '@subwallet/extension-koni-ui/hooks/dom/useIsPopup';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { windowOpen } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { computeStatus, openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { BackgroundIcon, Button, ButtonProps, Icon, Image, ModalContext, SettingItem, SwHeader, SwIconProps, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowsOut, ArrowSquareOut, Book, BookBookmark, CaretRight, ChatTeardropText, Coin, EnvelopeSimple, FrameCorners, Globe, GlobeHemisphereEast, Lock, Rocket, ShareNetwork, ShieldCheck, X } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
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
  const { goHome } = useDefaultNavigate();
  const { t } = useTranslation();
  const [locking, setLocking] = useState(false);
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { missions } = useSelector((state: RootState) => state.missionPool);

  const liveMissionsCount = useMemo(() => {
    return missions?.filter ? missions.filter((item) => computeStatus(item) === 'live').length : 0;
  }, [missions]);

  const { isUILocked, lock, unlock } = useUILock();

  const onLock = useCallback(() => {
    if (isUILocked) {
      unlock();
      goHome();
    } else {
      setLocking(true);
      lock()
        .then(() => {
          // goHome(); // with new root logic, not require go home after lock
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
        },
        {
          key: 'crowdloans',
          leftIcon: Rocket,
          leftIconBgColor: token['cyan-5'],
          rightIcon: CaretRight,
          title: t('Crowdloans'),
          onClick: () => {
            navigate('/settings/crowdloans', { state: true });
          }
        }
      ]
    },
    {
      key: 'website-access',
      label: t('Website access'),
      items: [
        {
          key: 'manage-website-access',
          leftIcon: GlobeHemisphereEast,
          leftIconBgColor: token['blue-7'],
          rightIcon: CaretRight,
          title: t('Manage website access'),
          onClick: () => {
            navigate('/settings/dapp-access');
          }
        },
        {
          key: 'wallet-connect',
          leftIcon: (
            <WalletConnect
              height='1em'
              width='1em'
            />
          ),
          leftIconBgColor: token['geekblue-6'],
          rightIcon: CaretRight,
          title: t('WalletConnect'),
          onClick: () => {
            navigate('/wallet-connect/list');
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
      key: 'community-&-support',
      label: t('Community & support'),
      items: [
        {
          key: 'contact-support',
          leftIcon: EnvelopeSimple,
          leftIconBgColor: token['geekblue-6'],
          rightIcon: ArrowSquareOut,
          title: t('Contact support'),
          onClick: () => {
            window.open(`${SUPPORT_MAIL}?subject=[Extension - In-app support]`, '_self');
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
              src={DefaultLogosMap.subwallet}
              width={24}
            />
          ),
          leftIconBgColor: token['magenta-7'],
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

  const closeModal = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  return (
    <PageWrapper className={`settings ${className}`}>
      <>
        <SwHeader
          className={'setting-header'}
          left='logo'
          onClickLeft={goHome}
          rightButtons={headerIcons}
          showLeftButton={true}
        >
          {t('Settings')}
        </SwHeader>

        <div className={'__scroll-container'}>
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
                          className={'__setting-item setting-item'}
                          key={item.key}
                          leftItemIcon={generateLeftIcon(item.leftIconBgColor, item.leftIcon)}
                          name={item.title}
                          onPressItem={item.onClick}
                          rightItem={
                            <>
                              {(item.key === 'mission-pools' && !!liveMissionsCount) && (
                                <div className={'__active-count'}>{liveMissionsCount}</div>
                              )}
                              {generateRightIcon(item.rightIcon)}
                            </>
                          }
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
          SubWallet v {EXTENSION_VERSION}
          </div>
        </div>
        <Outlet />
        <SwModal
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
        </SwModal>
      </>
    </PageWrapper>
  );
}

export const Settings = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '&.settings': {
      height: '100%',
      backgroundColor: token.colorBgDefault,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      '.__active-count': {
        borderRadius: '50%',
        color: token.colorWhite,
        fontSize: token.fontSizeSM,
        fontWeight: token.bodyFontWeight,
        lineHeight: token.lineHeightSM,
        paddingTop: 0,
        paddingRight: token.paddingXS,
        paddingLeft: token.paddingXS,
        paddingBottom: 0,
        backgroundColor: token.colorError,
        marginRight: 14
      },

      '.ant-sw-header-container': {
        paddingTop: token.padding,
        paddingBottom: token.padding,
        backgroundColor: token.colorBgDefault
      },
      '.__setting-item': {
        height: 52,
        display: 'flex',
        alignItems: 'center'
      },

      '.ant-sw-header-center-part': {
        color: token.colorTextLight1,
        fontSize: token.fontSizeHeading4,
        lineHeight: token.lineHeightHeading4,
        fontWeight: token.headingFontWeight
      },

      '.__scroll-container': {
        overflow: 'auto',
        paddingTop: token.padding,
        paddingRight: token.padding,
        paddingLeft: token.padding,
        paddingBottom: token.paddingLG
      },

      '.__group-label': {
        color: token.colorTextLight3,
        fontSize: token.fontSizeSM,
        lineHeight: token.lineHeightSM,
        marginBottom: token.marginXS,
        textTransform: 'uppercase'
      },

      '.__group-container': {
        paddingBottom: token.padding
      },

      '.__setting-item + .__setting-item': {
        marginTop: token.marginXS
      },

      '.ant-web3-block-right-item': {
        minWidth: 40,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
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
      }
    },
    '&.about-subwallet-modal': {
      '.__setting-about-item': {
        marginBottom: 8
      },
      '.ant-web3-block-right-item': {
        display: 'flex',
        minWidth: 40,
        justifyContent: 'center',
        alignContent: 'center'
      }
    }
  });
});

export default Settings;
