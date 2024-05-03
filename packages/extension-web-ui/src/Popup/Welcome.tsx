// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-web-ui/components';
import { AutoConnect, CONFIRM_GENERAL_TERM, CONNECT_EXTENSION, CREATE_RETURN, DEFAULT_ACCOUNT_TYPES, DEFAULT_ROUTER_PATH, PREDEFINED_WALLETS, SELECTED_ACCOUNT_TYPE } from '@subwallet/extension-web-ui/constants';
import { ATTACH_ACCOUNT_MODAL, CREATE_ACCOUNT_MODAL, GENERAL_TERM_AND_CONDITION_MODAL, IMPORT_ACCOUNT_MODAL, SELECT_ACCOUNT_MODAL } from '@subwallet/extension-web-ui/constants/modal';
import { InjectContext } from '@subwallet/extension-web-ui/contexts/InjectContext';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import { createAccountExternalV2 } from '@subwallet/extension-web-ui/messaging';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-web-ui/types';
import { checkHasInjected } from '@subwallet/extension-web-ui/utils/wallet';
import { Button, ButtonProps, Form, Icon, Image, Input, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { FileArrowDown, PlusCircle, PuzzlePiece, Swatches, Wallet } from 'phosphor-react';
import { Callbacks, FieldData, RuleObject } from 'rc-field-form/lib/interface';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { GeneralTermModal } from '../components/Modal/TermsAndConditions/GeneralTermModal';
import SocialGroup from '../components/SocialGroup';
import { ScreenContext } from '../contexts/ScreenContext';
import useGetDefaultAccountName from '../hooks/account/useGetDefaultAccountName';
import usePreloadView from '../hooks/router/usePreloadView';
import { convertFieldToObject, isMobile, readOnlyScan, simpleCheckForm } from '../utils';

type Props = ThemeProps;

interface ReadOnlyAccountInput {
  address?: string;
}

interface WelcomeButtonItem {
  id: string;
  icon: PhosphorIcon;
  schema: ButtonProps['schema'];
  title: string;
  description: string;
  loading: boolean;
}

function Component ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);
  const { enableInject, loadingInject, selectWallet } = useContext(InjectContext);

  const { accounts, isNoAccount } = useSelector((root: RootState) => root.accountState);

  const autoGenAttachReadonlyAccountName = useGetDefaultAccountName();
  const [, setSelectedAccountTypes] = useLocalStorage(SELECTED_ACCOUNT_TYPE, DEFAULT_ACCOUNT_TYPES);
  const [_returnPath, setReturnStorage] = useLocalStorage(CREATE_RETURN, DEFAULT_ROUTER_PATH);
  const [modalIdAfterConfirm, setModalIdAfterConfirm] = useState('');
  const [_isConfirmedTermGeneral, setIsConfirmedTermGeneral] = useLocalStorage(CONFIRM_GENERAL_TERM, 'nonConfirmed');

  const [form] = Form.useForm<ReadOnlyAccountInput>();

  const [reformatAttachAddress, setReformatAttachAddress] = useState('');
  const [returnPath] = useState(_returnPath);
  const [loading, setLoading] = useState(false);
  const [isAttachAddressEthereum, setAttachAddressEthereum] = useState(false);
  const [isAttachReadonlyAccountButtonDisable, setIsAttachReadonlyAccountButtonDisable] = useState(true);

  usePreloadView([
    'CreatePassword',
    'CreateDone',
    'NewSeedPhrase'
  ]);

  const formDefault: ReadOnlyAccountInput = {
    address: ''
  };

  const handleResult = useCallback((val: string) => {
    const result = readOnlyScan(val);

    if (result) {
      setReformatAttachAddress(result.content);
      setAttachAddressEthereum(result.isEthereum);
    }
  }, []);

  const onFieldsChange: Callbacks<ReadOnlyAccountInput>['onFieldsChange'] =
    useCallback(
      (changes: FieldData[], allFields: FieldData[]) => {
        const { empty, error } = simpleCheckForm(allFields);

        setIsAttachReadonlyAccountButtonDisable(error || empty);

        const changeMap = convertFieldToObject<ReadOnlyAccountInput>(changes);

        if (changeMap.address) {
          handleResult(changeMap.address);
        }
      },
      [handleResult]
    );

  const accountAddressValidator = useCallback(
    (rule: RuleObject, value: string) => {
      const result = readOnlyScan(value);

      if (result) {
        // For each account, check if the address already exists return promise reject
        for (const account of accounts) {
          if (account.address === result.content) {
            setReformatAttachAddress('');

            return Promise.reject(t('Account already exists'));
          }
        }
      } else {
        setReformatAttachAddress('');

        if (value !== '') {
          return Promise.reject(t('Invalid address'));
        }
      }

      return Promise.resolve();
    },
    [accounts, t]
  );

  const buttonList = useMemo((): WelcomeButtonItem[] => [
    {
      description: t('Connect to your existing wallet'),
      icon: PuzzlePiece,
      id: CONNECT_EXTENSION,
      schema: 'primary',
      title: t('Connect wallet'),
      loading: loadingInject
    },
    {
      description: t('Create a new account with SubWallet'),
      icon: PlusCircle,
      id: CREATE_ACCOUNT_MODAL,
      schema: 'secondary',
      title: t('Create a new account'),
      loading: false
    },
    {
      description: t('Import an existing account'),
      icon: FileArrowDown,
      id: IMPORT_ACCOUNT_MODAL,
      schema: 'secondary',
      title: t('Import an account'),
      loading: false
    },
    {
      description: t('Attach an account without private key'),
      icon: Swatches,
      id: ATTACH_ACCOUNT_MODAL,
      schema: 'secondary',
      title: t('Attach an account'),
      loading: false
    }
  ], [t, loadingInject]);

  const openModal = useCallback((id: string) => {
    return () => {
      if (id === CONNECT_EXTENSION) {
        selectWallet();
      } else if (id === CREATE_ACCOUNT_MODAL) {
        setSelectedAccountTypes(DEFAULT_ACCOUNT_TYPES);
        navigate('/accounts/new-seed-phrase');
      } else {
        inactiveModal(SELECT_ACCOUNT_MODAL);
        activeModal(id);
      }

      setIsConfirmedTermGeneral('confirmed');
    };
  }
  , [setIsConfirmedTermGeneral, selectWallet, setSelectedAccountTypes, navigate, inactiveModal, activeModal]);

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

  const afterConfirmTermToAttachReadonlyAccount = useCallback(() => {
    setLoading(true);

    if (reformatAttachAddress) {
      createAccountExternalV2({
        name: autoGenAttachReadonlyAccountName,
        address: reformatAttachAddress,
        genesisHash: '',
        isEthereum: isAttachAddressEthereum,
        isAllowed: true,
        isReadOnly: true
      })
        .then((errors) => {
          if (errors.length) {
            form.setFields([
              { name: 'address', errors: errors.map((e) => e.message) }
            ]);
          } else {
            navigate('/create-done');
          }
        })
        .catch((error: Error) => {
          form.setFields([{ name: 'address', errors: [error.message] }]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    setIsConfirmedTermGeneral('confirmed');
  }, [reformatAttachAddress, setIsConfirmedTermGeneral, autoGenAttachReadonlyAccountName, isAttachAddressEthereum, form, navigate]);

  const onSubmitAttachReadonlyAccount = useCallback(() => {
    setModalIdAfterConfirm('');

    if (_isConfirmedTermGeneral.includes('nonConfirmed')) {
      activeModal(GENERAL_TERM_AND_CONDITION_MODAL);
    } else {
      afterConfirmTermToAttachReadonlyAccount();
    }
  }, [_isConfirmedTermGeneral, activeModal, afterConfirmTermToAttachReadonlyAccount]);

  useEffect(() => {
    if (!isNoAccount) {
      navigate(returnPath, { state: { from: returnPath } });
      setReturnStorage(DEFAULT_ROUTER_PATH);
    }
  }, [isNoAccount, navigate, returnPath, setReturnStorage]);

  useEffect(() => {
    if (isMobile && !AutoConnect.ignore) {
      const installedWallet = Object.values(PREDEFINED_WALLETS).find((w) => (w.supportMobile && checkHasInjected(w.key)));

      if (installedWallet) {
        enableInject(installedWallet.key);
      }
    }
  }, [enableInject]);

  return (
    <Layout.Base
      className={CN(className, '__welcome-layout-containter')}
    >
      {!isWebUI && <div className='bg-image' />}
      <div className={'body-container'}>
        <div className={CN('brand-container', 'flex-column')}>
          <div className='logo-container'>
            {
              isWebUI
                ? (
                  <Image
                    src='/images/subwallet/gradient-logo.png'
                    width={80}
                  />
                )
                : (
                  <Image
                    src={'./images/subwallet/welcome-logo.png'}
                    width={139}
                  />
                )
            }
          </div>
          {
            isWebUI && (<div className='title'>{t('Welcome to SubWallet!')}</div>)
          }
          <div className='sub-title'>
            {t('Choose how you\'d like to set up your wallet')}
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
                loading={item.loading}
                onClick={onClickToSelectTypeConnect(item.id)}
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

          <div className='divider' />
        </div>

        {isWebUI && (
          <>
            <Form
              className={CN('add-wallet-container')}
              form={form}
              initialValues={formDefault}
              onFieldsChange={onFieldsChange}
              onFinish={onSubmitAttachReadonlyAccount}
            >
              <div className='form-title lg-text'>{t('Watch any wallet')}?</div>
              <Form.Item
                name={'address'}
                rules={[
                  {
                    message: t('Account address is required'),
                    required: true
                  },
                  {
                    validator: accountAddressValidator
                  }
                ]}
                statusHelpAsTooltip={true}
              >
                <Input
                  placeholder={t('Enter address')}
                  prefix={<Wallet size={24} />}
                  type={'text'}
                />
              </Form.Item>
              <Button
                block
                className='add-wallet-button'
                disabled={isAttachReadonlyAccountButtonDisable}
                loading={loading}
                onClick={form.submit}
                schema='primary'
              >
                {t('Add watch-only wallet')}
              </Button>
            </Form>
          </>
        )}
      </div>

      {isWebUI && (
        <SocialGroup className={'social-group'} />
      )}
      <GeneralTermModal onOk={modalIdAfterConfirm === '' ? afterConfirmTermToAttachReadonlyAccount : openModal(modalIdAfterConfirm)} />
    </Layout.Base>
  );
}

const Welcome = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    position: 'relative',

    '.ant-sw-screen-layout-body': {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
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
      opacity: 0.1,
      zIndex: -1
    },

    '.brand-container': {
      paddingTop: 6
    },

    '.divider': {
      height: 2,
      backgroundColor: token.colorBgDivider,
      opacity: 0.8,
      width: '100%'
    },

    '.body-container': {
      padding: `0 ${token.padding}px`,
      textAlign: 'center',
      opacity: 0.999, // Hot fix show wrong opacity in browser

      '.title': {
        marginTop: token.margin,
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeHeading3,
        lineHeight: token.lineHeightHeading3,
        color: token.colorTextBase
      },

      '.sub-title': {
        marginTop: token.marginXS,
        marginBottom: token.sizeLG * 2 + token.sizeXS,
        fontSize: token.fontSizeHeading5,
        lineHeight: token.lineHeightHeading5,
        color: token.colorTextLight3
      },

      '.form-title': {
        color: token.colorTextLight3,
        marginBottom: token.margin
      },

      '.add-wallet-container': {
        maxWidth: 384,
        width: '100%',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginBottom: token.margin
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
    },

    '.social-group': {
      marginTop: 0,
      paddingTop: token.paddingLG
    },

    '.web-ui-enable &': {
      textAlign: 'center',
      height: '100%',
      width: '100%',
      maxWidth: 816,
      margin: '0 auto',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,

      '.ant-sw-screen-layout-body': {
        justifyContent: 'flex-start'
      },

      '.body-container': {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      },

      '.logo-container': {
        height: 120,
        color: token.colorTextBase,
        marginBottom: token.margin,
        marginTop: 24
      },

      '.title': {
        marginBottom: token.marginXS
      },

      '.sub-title': {
        margin: 0
      },

      '.buttons-container': {
        marginBottom: token.marginXL,
        marginTop: 72,
        width: '100%',

        '.divider': {
          marginTop: token.marginLG
        },

        '.buttons': {
          display: 'grid',
          gridTemplateRows: '1fr 1fr',
          gridTemplateColumns: '1fr 1fr',
          gap: token.sizeMS,

          '.ant-btn:not(.-icon-only) .ant-btn-loading-icon>.anticon': {
            fontSize: 24,
            height: 24,
            width: 24,
            marginLeft: 4,
            marginRight: 0
          },

          [`.type-${CREATE_ACCOUNT_MODAL}`]: {
            color: token['green-6']
          },

          [`.type-${IMPORT_ACCOUNT_MODAL}`]: {
            color: token['orange-7']
          },

          [`.type-${ATTACH_ACCOUNT_MODAL}`]: {
            color: token['magenta-6']
          },

          [`.type-${CONNECT_EXTENSION}`]: {
            color: token.colorSuccess,
            order: -1
          },

          '.welcome-import-button': {
            width: '100%',
            paddingRight: 14
          }
        }
      },

      '@media (max-width: 1600px)': {
        '.buttons-container': {
          marginTop: 32,
          marginBottom: 32
        },

        '.add-wallet-container': {
          marginBottom: 0
        },

        '.social-group': {
          paddingBottom: 32
        }
      }
    }
  };
});

export default Welcome;
