// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import LoginBg from '@subwallet/extension-koni-ui/assets/WelcomeBg.png';
import { Layout } from '@subwallet/extension-koni-ui/components';
import Logo3D from '@subwallet/extension-koni-ui/components/Logo/Logo3D';
import { EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants/account';
import { ATTACH_ACCOUNT_MODAL, CREATE_ACCOUNT_MODAL, IMPORT_ACCOUNT_MODAL, SELECT_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, ButtonProps, Icon, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { FileArrowDown, PlusCircle, Swatches } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

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
        navigate('/accounts/new-seed-phrase', { state: { accountTypes: [SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE] } });
      } else {
        inactiveModal(SELECT_ACCOUNT_MODAL);
        activeModal(id);
      }
    };
  }, [activeModal, inactiveModal, navigate]);

  return (
    <Layout.Base
      className={CN(className)}
    >
      <div className='bg-image' />
      <div className='body-container'>
        <div className='logo-container'>
          <Logo3D
            height={100}
            width={66}
          />
        </div>
        <div className='title'>
          {t('SubWallet')}
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
                onClick={openModal(item.id)}
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
    </Layout.Base>
  );
}

const Welcome = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    position: 'relative',

    '.bg-image': {
      backgroundImage: `url(${LoginBg})`,
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
      padding: `0 ${token.padding}px`,
      textAlign: 'center',
      opacity: 0.999, // Hot fix show wrong opacity in browser

      '.logo-container': {
        marginTop: token.sizeLG * 3,
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
        marginBottom: token.sizeLG * 3,
        fontSize: token.fontSizeHeading5,
        lineHeight: token.lineHeightHeading5,
        color: token.colorTextLight3
      },

      '.buttons-container': {
        display: 'flex',
        flexDirection: 'column',
        gap: token.sizeXS,

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
      }
    }
  };
});

export default Welcome;
