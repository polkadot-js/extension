// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { GeneralTermModal } from '@subwallet/extension-koni-ui/components/Modal/TermsAndConditions/GeneralTermModal';
import { ATTACH_ACCOUNT_MODAL, CONFIRM_GENERAL_TERM, CREATE_ACCOUNT_MODAL, DEFAULT_ACCOUNT_TYPES, GENERAL_TERM_AND_CONDITION_MODAL, IMPORT_ACCOUNT_MODAL, SELECT_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants';
import { useSetSelectedAccountTypes, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, ButtonProps, Icon, Image, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { FileArrowDown, PlusCircle, Swatches } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

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
  const navigate = useNavigate();
  const setSelectedAccountTypes = useSetSelectedAccountTypes(false);
  const [modalIdAfterConfirm, setModalIdAfterConfirm] = useState('');
  const [_isConfirmedTermGeneral, setIsConfirmedTermGeneral] = useLocalStorage(CONFIRM_GENERAL_TERM, 'nonConfirmed');
  const items = useMemo((): WelcomeButtonItem[] => [
    {
      description: t('Create a new account with SubWallet'),
      icon: PlusCircle,
      id: CREATE_ACCOUNT_MODAL,
      schema: 'primary',
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
    }
  ], [t]);

  const openModal = useCallback((id: string) => {
    return () => {
      if (id === CREATE_ACCOUNT_MODAL) {
        setSelectedAccountTypes(DEFAULT_ACCOUNT_TYPES);
        navigate('/accounts/new-seed-phrase');
      } else {
        inactiveModal(SELECT_ACCOUNT_MODAL);
        activeModal(id);
      }

      setIsConfirmedTermGeneral('confirmed');
    };
  }, [activeModal, inactiveModal, navigate, setIsConfirmedTermGeneral, setSelectedAccountTypes]);

  const onClickToSelectTypeConnect = useCallback((idModal: string) => {
    return () => {
      setModalIdAfterConfirm(idModal);

      if (_isConfirmedTermGeneral.includes('nonConfirmed')) {
        activeModal(GENERAL_TERM_AND_CONDITION_MODAL);
      } else {
        openModal(idModal)();
      }
    };
  }, [_isConfirmedTermGeneral, activeModal, openModal]);

  return (
    <Layout.Base
      className={CN(className)}
    >
      <div className='bg-image' />
      <div className='body-container'>
        <div className='logo-container'>
          <Image
            src={'./images/subwallet/welcome-logo.png'}
            width={139}
          />
        </div>
        <div className='sub-title'>
          {t('Choose how you\'d like to set up your wallet')}
        </div>
        <div className='buttons-container'>
          {
            items.map((item) => (
              <Button
                block={true}
                className='welcome-import-button'
                contentAlign='left'
                icon={(
                  <Icon
                    className='welcome-import-icon'
                    phosphorIcon={item.icon}
                    size='md'
                    weight='fill'
                  />
                )}
                key={item.id}
                onClick={onClickToSelectTypeConnect(item.id)}
                schema={item.schema}
              >
                <div className='welcome-import-button-content'>
                  <div className='welcome-import-button-title'>{item.title}</div>
                  <div className='welcome-import-button-description'>{item.description}</div>
                </div>
              </Button>
            ))
          }
        </div>
      </div>
      <GeneralTermModal onOk={openModal(modalIdAfterConfirm)} />
    </Layout.Base>
  );
}

const Welcome = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    position: 'relative',

    '.bg-image': {
      backgroundImage: 'url("./images/subwallet/welcome-background.png")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'top',
      backgroundSize: 'contain',
      height: '100%',
      position: 'absolute',
      width: '100%',
      left: 0,
      top: 0
    },

    '.body-container': {
      padding: `${token.sizeLG * 3}px ${token.padding}px ${token.sizeXL}px`,
      textAlign: 'center',
      opacity: 0.999, // Hot fix show wrong opacity in browser
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeLG,

      '.logo-container': {
        color: token.colorTextBase
      },

      '.title': {
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeHeading1,
        lineHeight: token.lineHeightHeading1,
        color: token.colorTextBase
      },

      '.sub-title': {
        paddingLeft: token.padding - 1,
        paddingRight: token.padding - 1,
        fontSize: token.fontSizeHeading5,
        lineHeight: token.lineHeightHeading5,
        color: token.colorTextLight3,
        flex: 1
      }
    },

    '.buttons-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
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
