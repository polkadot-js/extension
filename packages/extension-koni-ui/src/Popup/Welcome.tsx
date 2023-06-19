// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants/account';
import { ATTACH_ACCOUNT_MODAL, CREATE_ACCOUNT_MODAL, DOWNLOAD_EXTENSION, IMPORT_ACCOUNT_MODAL, SELECT_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, ButtonProps, Divider, Icon, Image, Input, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { Eye, EyeClosed, FileArrowDown, PlusCircle, PuzzlePiece, Swatches, Wallet } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import SocialGroup from '../components/SocialGroup';
import { EXTENSION_URL } from '../constants';
import { ScreenContext } from '../contexts/ScreenContext';
import { openInNewTab } from '../utils';

type Props = ThemeProps;

interface WelcomeButtonItem {
  id: string;
  icon: PhosphorIcon;
  schema: ButtonProps['schema'];
  title: string;
  description: string;
}

function Component ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const navigate = useNavigate();
  const handlePasswordToggle = useCallback(() => setPasswordVisible(!passwordVisible), [passwordVisible]);

  const renderEyecon = useMemo(
    () => {
      const Icon = passwordVisible ? Eye : EyeClosed;

      return (
        <Button
          icon={<Icon size={24} />}
          onClick={handlePasswordToggle}
          type='ghost'
        />
      );
    }
    , [handlePasswordToggle, passwordVisible]);

  const items = useMemo((): WelcomeButtonItem[] => [
    {
      description: t('Create a new account with SubWallet'),
      icon: PlusCircle,
      id: CREATE_ACCOUNT_MODAL,
      schema: 'secondary',
      title: t('Create a new account')
    },
    {
      description: t('Import an existing account'),
      icon: FileArrowDown,
      id: IMPORT_ACCOUNT_MODAL,
      schema: 'secondary',
      title: t('Import an account')
    },
    {
      description: t('Attach an account without private key'),
      icon: Swatches,
      id: ATTACH_ACCOUNT_MODAL,
      schema: 'secondary',
      title: t('Attach an account')
    },
    {
      description: 'For management of your account keys',
      icon: PuzzlePiece,
      id: DOWNLOAD_EXTENSION,
      schema: 'secondary',
      title: 'Download SubWallet extension'
    }
  ], [t]);

  const buttonList = useMemo(() => isWebUI ? items : items.slice(0, 3), [isWebUI, items]);

  const openModal = useCallback((id: string) => {
    return () => {
      if (id === DOWNLOAD_EXTENSION) {
        openInNewTab(EXTENSION_URL)();

        return;
      }

      if (id === CREATE_ACCOUNT_MODAL) {
        navigate('/accounts/new-seed-phrase', { state: { accountTypes: [SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE] } });
      } else {
        inactiveModal(SELECT_ACCOUNT_MODAL);
        activeModal(id);
      }
    };
  }, [activeModal, inactiveModal, navigate]
  );

  return (
    <Layout.Base
      className={CN(className, '__welcome-layout-containter')}
      headerList={['Simple']}
      showWebHeader
    >
      <div className='bg-gradient' />
      {!isWebUI && <div className='bg-image' />}
      <div className={CN('body-container', {
        '__web-ui': isWebUI,
        'flex-column': isWebUI
      })}
      >
        <div className={CN('brand-container', 'flex-column')}>
          <div className='logo-container'>
            <Image
              src={'/images/subwallet/welcome-logo.png'}
              width={139}
            />
          </div>
          {/* <div className='title'>{t(isWebUI ? 'Welcome to SubWallet!' : 'SubWallet')}</div> */}
          <div className='sub-title'>
            {t(isWebUI ? "Choose how you'd like to set up your wallet" : 'Polkadot, Substrate & Ethereum wallet')}
          </div>
        </div>

        <div className='buttons-container'>
          <div className='buttons'>
            {buttonList.map((item) => (
              <Button
                block={true}
                className={CN('welcome-import-button', `type-${item.id}`)}
                contentAlign='left'
                icon={
                  <Icon
                    className='welcome-import-icon'
                    phosphorIcon={item.icon}
                    size='md'
                    weight='fill'
                  />
                }
                key={item.id}
                onClick={openModal(item.id)}
                schema={item.schema}
              >
                <div className='welcome-import-button-content'>
                  <div className='welcome-import-button-title'>
                    {t(item.title)}
                  </div>
                  <div className='welcome-import-button-description'>
                    {t(item.description)}
                  </div>
                </div>
              </Button>
            ))}
          </div>

          <Divider className='divider' />
        </div>

        {isWebUI && (
          <>
            <div className={CN('add-wallet-container', 'flex-column')}>
              <div className='sub-title'>{t('Watch any wallet')}</div>
              <Input
                className='address-input'
                placeholder={t('Enter address')}
                prefix={<Wallet size={24} />}
                suffix={renderEyecon}
                type={passwordVisible ? 'text' : 'password'}
              />
              <Button
                block
                className='add-wallet-button'
                schema='primary'
              >
                {t('Add watch-only wallet')}
              </Button>
            </div>

            <SocialGroup />
          </>
        )}
      </div>
    </Layout.Base>
  );
}

const Welcome = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    position: 'relative',

    '.ant-sw-screen-layout-body': {
      display: 'flex',
      flexDirection: 'column'
    },

    '.flex-column': {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-around',
      alignItems: 'center'
    },

    '.bg-gradient': {
      background:
        'linear-gradient(180deg, rgba(0, 75, 255, 0.1) 16.47%, rgba(217, 217, 217, 0) 94.17%)',
      height: 290,
      width: '100%',
      position: 'absolute',
      left: 0,
      top: 0
    },

    '.bg-image': {
      backgroundImage: 'url("/images/subwallet/welcome-background.png")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'top',
      backgroundSize: 'contain',
      height: '100%',
      position: 'absolute',
      width: '100%',
      left: 0,
      top: 0,
      opacity: 0.1
    },

    '.body-container': {
      padding: `0 ${token.padding}px`,
      textAlign: 'center',
      opacity: 0.999, // Hot fix show wrong opacity in browser

      '.logo-container': {
        marginTop: token.sizeLG * 3,
        marginBottom: token.sizeLG,
        color: token.colorTextBase
      },

      '.title': {
        marginTop: token.marginXS,
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeHeading1,
        lineHeight: token.lineHeightHeading1,
        color: token.colorTextBase
      },

      '.sub-title': {
        marginTop: token.marginXS,
        marginBottom: token.sizeLG * 2 + token.sizeXS,
        fontSize: token.fontSizeHeading5,
        lineHeight: token.lineHeightHeading5,
        color: token.colorTextLight3
      },

      '&.__web-ui': {
        textAlign: 'center',
        height: '100%',
        width: 'fit-content',
        margin: '0 auto',

        '.add-wallet-container': {
          width: '60%',
          alignItems: 'stretch',

          '.address-input': {
            margin: `${token.marginSM + 4}px 0`
          },
          '.add-wallet-button': {
            marginBottom: token.marginSM
          }
        },

        '.title': {
          marginTop: token.marginSM + 4,
          marginBottom: token.marginXS
        },

        '.sub-title': {
          margin: 0
        },

        '.logo-container': {
          marginTop: 0,
          color: token.colorTextBase
        },

        '.buttons-container': {
          marginBottom: token.marginXL,
          marginTop: token.marginXL * 2,

          '.divider': {
            marginTop: token.marginLG + 2
          },

          '.buttons': {
            display: 'grid',
            // flexDirection: "column",
            gridTemplateRows: '1fr 1fr',
            gridTemplateColumns: '1fr 1fr',
            gap: token.sizeMS,

            [`.type-${CREATE_ACCOUNT_MODAL}`]: {
              color: token['green-6']
            },

            [`.type-${IMPORT_ACCOUNT_MODAL}`]: {
              color: token['orange-7']
            },

            [`.type-${ATTACH_ACCOUNT_MODAL}`]: {
              color: token['magenta-6']
            },
            [`.type-${DOWNLOAD_EXTENSION}`]: {
              color: '#4CEAAC'
            },

            '.welcome-import-button': {
              width: '100%',
              paddingRight: token.sizeXL
            }
          }
        }
      }
    },

    '.buttons-container': {
      '.buttons': {
        display: 'flex',
        flexDirection: 'column',
        gap: token.sizeXS
      }
    },

    '.welcome-import-button': {
      height: 'auto',

      '.welcome-import-icon': {
        height: token.sizeLG,
        width: token.sizeLG,
        marginLeft: token.sizeMD - token.size
      },

      '.welcome-import-button-content': {
        display: 'flex',
        flexDirection: 'column',
        gap: token.sizeXXS,
        fontWeight: token.fontWeightStrong,
        padding: `${token.paddingSM - 1}px ${token.paddingLG}px`,
        textAlign: 'start',

        '.welcome-import-button-title': {
          fontSize: token.fontSizeHeading5,
          lineHeight: token.lineHeightHeading5,
          color: token.colorTextBase
        },

        '.welcome-import-button-description': {
          fontSize: token.fontSizeHeading6,
          lineHeight: token.lineHeightHeading6,
          color: token.colorTextLabel
        }
      }
    }

  };
});

export default Welcome;
