// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { EDIT_AUTO_LOCK_TIME_MODAL } from '@subwallet/extension-koni-ui/constants';
import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-koni-ui/constants/router';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import useIsPopup from '@subwallet/extension-koni-ui/hooks/dom/useIsPopup';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { saveAutoLockTime, saveCameraSetting, windowOpen } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { noop } from '@subwallet/extension-koni-ui/utils';
import { isNoAccount } from '@subwallet/extension-koni-ui/utils/account/account';
import { BackgroundIcon, Icon, ModalContext, SettingItem, Switch, SwModal, SwSubHeader } from '@subwallet/react-ui';
import CN from 'classnames';
import { Camera, CaretRight, CheckCircle, GlobeHemisphereEast, Key, LockLaminated } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

enum SecurityType {
  WALLET_PASSWORD = 'wallet-password',
  WEBSITE_ACCESS = 'website-access',
  CAMERA_ACCESS = 'camera-access',
  AUTO_LOCK = 'auto-lock'
}

interface SecurityItem {
  icon: PhosphorIcon;
  key: SecurityType;
  title: string;
  url: string;
}

interface AutoLockOption {
  label: string;
  value: number;
}

const items: SecurityItem[] = [
  {
    icon: Key,
    key: SecurityType.WALLET_PASSWORD,
    title: 'Change wallet password',
    url: '/keyring/change-password'
  },
  {
    icon: GlobeHemisphereEast,
    key: SecurityType.WEBSITE_ACCESS,
    title: 'Manage website access',
    url: '/settings/dapp-access'
  }
];

const modalId = EDIT_AUTO_LOCK_TIME_MODAL;

const timeOptions = [5, 10, 15, 30, 60];

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const { goBack } = useDefaultNavigate();
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack = !!location.state;
  const isPopup = useIsPopup();
  const { isWebUI } = useContext(ScreenContext)

  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { accounts } = useSelector((state: RootState) => state.accountState);
  const { camera, timeAutoLock } = useSelector((state: RootState) => state.settings);

  const noAccount = useMemo(() => isNoAccount(accounts), [accounts]);

  const autoLockOptions = useMemo((): AutoLockOption[] => timeOptions.map((value) => ({
    value: value,
    label: t('{{time}} minutes', { replace: { time: value } })
  })), [t]);

  const [loading, setLoading] = useState(false);

  const onBack = useCallback(() => {
    if (canGoBack) {
      goBack();
    } else {
      if (noAccount) {
        navigate(DEFAULT_ROUTER_PATH);
      } else {
        navigate('/settings/list');
      }
    }
  }, [canGoBack, goBack, navigate, noAccount]);

  const updateCamera = useCallback((currentValue: boolean) => {
    return () => {
      setLoading(true);

      let openNewTab = false;

      if (!currentValue) {
        if (isPopup) {
          openNewTab = true;
        }
      }

      saveCameraSetting(!currentValue)
        .then(() => {
          if (openNewTab) {
            windowOpen('/settings/security')
              .catch((e: Error) => {
                console.log(e);
              });
          }
        })
        .catch(console.error)
        .finally(() => {
          setLoading(false);
        });
    };
  }, [isPopup]);

  const onClickItem = useCallback((item: SecurityItem) => {
    return () => {
      navigate(item.url);
    };
  }, [navigate]);

  const onOpenModal = useCallback(() => {
    activeModal(modalId);
  }, [activeModal]);

  const onCloseModal = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const onSelectTime = useCallback((item: AutoLockOption) => {
    return () => {
      inactiveModal(modalId);
      saveAutoLockTime(item.value).finally(noop);
    };
  }, [inactiveModal]);

  useEffect(() => {
    if (camera) {
      window.navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          // Close video
          stream.getTracks().forEach((track) => {
            track.stop();
          });
        })
        .catch(console.error);
    }
  }, [camera]);

  return (
    <PageWrapper className={CN(className)}>
      <Layout.Base
        withSideMenu
        onBack={onBack}
        title={t('Security settings')}
      >
        {isWebUI && <SwSubHeader
          title={t('Security settings')}
          background='transparent'
          center={false}
          onBack={() => navigate(-1)}
          showBackButton={true}
        />}
        <div className={CN('body-container', {
          '__web-ui': isWebUI
        })}>
          <div className='items-container'>
            {
              items.map((item) => (
                <SettingItem
                  className={CN(
                    'security-item',
                    `security-type-${item.key}`,
                    {
                      disabled: noAccount
                    }
                  )}
                  key={item.key}
                  leftItemIcon={(
                    <BackgroundIcon
                      backgroundColor={'var(--icon-bg-color)'}
                      phosphorIcon={item.icon}
                      size='sm'
                      type='phosphor'
                      weight='fill'
                    />
                  )}
                  name={t(item.title)}
                  onPressItem={noAccount ? undefined : onClickItem(item)}
                  rightItem={(
                    <Icon
                      className='security-item-right-icon'
                      phosphorIcon={CaretRight}
                      size='sm'
                      type='phosphor'
                    />
                  )}
                />
              ))
            }
          </div>
          <div className='setting-config-container'>
            <div className='label'>
              {t('Camera access')}
            </div>
            <SettingItem
              className={CN('security-item', `security-type-${SecurityType.CAMERA_ACCESS}`)}
              leftItemIcon={(
                <BackgroundIcon
                  backgroundColor={'var(--icon-bg-color)'}
                  phosphorIcon={Camera}
                  size='sm'
                  type='phosphor'
                  weight='fill'
                />
              )}
              name={t('Allow QR camera access')}
              rightItem={(
                <Switch
                  checked={camera}
                  loading={loading}
                  onClick={updateCamera(camera)}
                />
              )}
            />
          </div>
          <div className='setting-config-container'>
            <div className='label'>
              {t('Auto lock')}
            </div>
            <SettingItem
              className={CN('security-item', `security-type-${SecurityType.AUTO_LOCK}`)}
              leftItemIcon={(
                <BackgroundIcon
                  backgroundColor={'var(--icon-bg-color)'}
                  phosphorIcon={LockLaminated}
                  size='sm'
                  type='phosphor'
                  weight='fill'
                />
              )}
              name={t('Extension auto lock')}
              onPressItem={onOpenModal}
              rightItem={(
                <Icon
                  className='security-item-right-icon'
                  phosphorIcon={CaretRight}
                  size='sm'
                  type='phosphor'
                />
              )}
            />
          </div>
        </div>
        <SwModal
          className={className}
          id={modalId}
          onCancel={onCloseModal}
          title={t('Auto lock')}
        >
          <div className='modal-body-container'>
            {
              autoLockOptions.map((item) => {
                const _selected = timeAutoLock === item.value;

                return (
                  <SettingItem
                    className={CN('__selection-item')}
                    key={item.value}
                    name={item.label}
                    onPressItem={onSelectTime(item)}
                    rightItem={
                      _selected
                        ? (
                          <Icon
                            className='__right-icon'
                            iconColor='var(--icon-color)'
                            phosphorIcon={CheckCircle}
                            size='sm'
                            type='phosphor'
                            weight='fill'
                          />
                        )
                        : null
                    }
                  />
                );
              })
            }
          </div>
        </SwModal>
      </Layout.Base>
    </PageWrapper>
  );
};

const SecurityList = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.body-container': {
      padding: `${token.padding}px ${token.padding}px`,

      '&.__web-ui': {
        padding: `${token.padding + 24}px ${token.padding}px ${token.padding}px`,
        maxWidth: '70%',
        margin: '0 auto',
      }
    },

    '.items-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    },

    [`.security-type-${SecurityType.WALLET_PASSWORD}`]: {
      '--icon-bg-color': token['geekblue-6'],

      '&:hover': {
        '--icon-bg-color': token['geekblue-7']
      }
    },

    [`.security-type-${SecurityType.WEBSITE_ACCESS}`]: {
      '--icon-bg-color': token['blue-7'],

      '&:hover': {
        '--icon-bg-color': token['blue-8']
      }
    },

    [`.security-type-${SecurityType.CAMERA_ACCESS}`]: {
      '--icon-bg-color': token['green-6'],

      '&:hover': {
        '--icon-bg-color': token['green-7']
      }
    },

    [`.security-type-${SecurityType.AUTO_LOCK}`]: {
      '--icon-bg-color': token['geekblue-6'],

      '&:hover': {
        '--icon-bg-color': token['geekblue-7']
      }
    },

    '.security-item': {
      '.ant-web3-block-right-item': {
        marginRight: token.sizeXXS,
        color: token['gray-4']
      },

      '&:hover': {
        '.ant-web3-block-right-item': {
          color: token['gray-6']
        }
      },

      '&.disabled': {
        opacity: 0.4,

        '.ant-setting-item-content': {
          cursor: 'not-allowed'
        }
      }
    },

    '.setting-config-container': {
      marginTop: token.marginLG,
      display: 'flex',
      flexDirection: 'column',
      gap: token.size,

      '.label': {
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeSM,
        lineHeight: token.lineHeightSM,
        color: token.colorTextLabel,
        textTransform: 'uppercase'
      }
    },

    '.modal-body-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    },

    '.__selection-item': {
      '--icon-color': token.colorSuccess
    },

    '.__right-icon': {
      marginRight: token.marginXS
    }
  };
});

export default SecurityList;
