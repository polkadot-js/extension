// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MantaPayEnableMessage } from '@subwallet/extension-base/background/KoniTypes';
import { detectTranslate } from '@subwallet/extension-base/utils';
import { CloseIcon, Layout, PageWrapper, ZkModeFooter } from '@subwallet/extension-koni-ui/components';
import AccountAvatar from '@subwallet/extension-koni-ui/components/Account/AccountAvatar';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useDeleteAccount from '@subwallet/extension-koni-ui/hooks/account/useDeleteAccount';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/account/useGetAccountByAddress';
import useGetAccountSignModeByAddress from '@subwallet/extension-koni-ui/hooks/account/useGetAccountSignModeByAddress';
import { useGetMantaPayConfig } from '@subwallet/extension-koni-ui/hooks/account/useGetMantaPayConfig';
import { useIsMantaPayAvailable } from '@subwallet/extension-koni-ui/hooks/account/useIsMantaPayAvailable';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import useUnlockChecker from '@subwallet/extension-koni-ui/hooks/common/useUnlockChecker';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { deriveAccountV3, disableMantaPay, editAccount, enableMantaPay, forgetAccount, windowOpen } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { PhosphorIcon, Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { AccountSignMode } from '@subwallet/extension-koni-ui/types/account';
import { FormCallbacks, FormFieldData } from '@subwallet/extension-koni-ui/types/form';
import { toShort } from '@subwallet/extension-koni-ui/utils';
import { copyToClipboard } from '@subwallet/extension-koni-ui/utils/common/dom';
import { convertFieldToObject } from '@subwallet/extension-koni-ui/utils/form/form';
import { BackgroundIcon, Button, Field, Form, Icon, Input, ModalContext, SettingItem, SwAlert, Switch, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { CircleNotch, CopySimple, Export, Eye, FloppyDiskBack, GitMerge, QrCode, ShieldCheck, Swatches, Trash, User, Wallet, Warning } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import useIsPopup from '../../hooks/dom/useIsPopup';

type Props = ThemeProps;

enum FormFieldName {
  NAME = 'name'
}

enum ActionType {
  EXPORT = 'export',
  DERIVE = 'derive',
  DELETE = 'delete'
}

interface DetailFormState {
  [FormFieldName.NAME]: string;
}

interface MantaPayState {
  shouldShowConfirmation: boolean,
  loading: boolean,
  error?: string
}

const DEFAULT_MANTA_PAY_STATE: MantaPayState = {
  shouldShowConfirmation: true,
  loading: false
};

export enum MantaPayReducerActionType {
  INIT = 'INIT',
  SET_SHOULD_SHOW_CONFIRMATION = 'SET_SHOULD_SHOW_CONFIRMATION',
  CONFIRM_ENABLE = 'CONFIRM_ENABLE',
  REJECT_ENABLE = 'REJECT_ENABLE',
  SYNC_FAIL = 'SYNC_FAIL',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR_MESSAGE = 'SET_ERROR_MESSAGE'
}

interface MantaPayReducerAction {
  type: MantaPayReducerActionType,
  payload: unknown
}

export const mantaPayReducer = (state: MantaPayState, action: MantaPayReducerAction): MantaPayState => {
  const { payload, type } = action;

  switch (type) {
    case MantaPayReducerActionType.INIT:
      return DEFAULT_MANTA_PAY_STATE;
    case MantaPayReducerActionType.SET_SHOULD_SHOW_CONFIRMATION:
      return {
        ...state,
        shouldShowConfirmation: payload as boolean
      };
    case MantaPayReducerActionType.CONFIRM_ENABLE:
      return {
        ...state,
        shouldShowConfirmation: false,
        loading: false
      };
    case MantaPayReducerActionType.REJECT_ENABLE:
      return {
        ...state,
        shouldShowConfirmation: false
      };
    case MantaPayReducerActionType.SYNC_FAIL:
      return {
        ...state,
        shouldShowConfirmation: false
      };
    case MantaPayReducerActionType.SET_LOADING:
      return {
        ...state,
        loading: payload as boolean
      };
    case MantaPayReducerActionType.SET_ERROR_MESSAGE:
      return {
        ...state,
        error: payload as string,
        loading: false
      };
    default:
      throw new Error("Can't handle action");
  }
};

const zkModeConfirmationId = 'zkModeConfirmation';

function getZkErrorMessage (error: MantaPayEnableMessage) {
  if (error === MantaPayEnableMessage.WRONG_PASSWORD) {
    return detectTranslate('Wrong password');
  } else if (error === MantaPayEnableMessage.CHAIN_DISCONNECTED) {
    return detectTranslate('Network is disconnected');
  }

  return detectTranslate('Some errors occurred. Please try again later');
}

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { goHome } = useDefaultNavigate();
  const [searchParams] = useSearchParams();
  const notify = useNotification();
  const { token } = useTheme() as Theme;
  const { accountAddress } = useParams();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const dataContext = useContext(DataContext);

  const enableMantaPayConfirm = searchParams.get('enableMantaPayConfirm') === 'true';
  const isPopup = useIsPopup();

  const [form] = Form.useForm<DetailFormState>();

  const account = useGetAccountByAddress(accountAddress);
  const deleteAccountAction = useDeleteAccount();

  const saveTimeOutRef = useRef<NodeJS.Timer>();

  const [deleting, setDeleting] = useState(false);
  const [deriving, setDeriving] = useState(false);
  const [saving, setSaving] = useState(false);
  const checkUnlock = useUnlockChecker();

  const signMode = useGetAccountSignModeByAddress(accountAddress);

  const mantaPayConfig = useGetMantaPayConfig(accountAddress || '');
  const isZkModeEnabled = useMemo(() => {
    return !!mantaPayConfig && mantaPayConfig.enabled;
  }, [mantaPayConfig]);
  const zkModeSyncState = useSelector((state: RootState) => state.mantaPay);
  const [mantaPayState, dispatchMantaPayState] = useReducer(mantaPayReducer, DEFAULT_MANTA_PAY_STATE);

  const handleEnableMantaPay = useCallback(() => {
    activeModal(zkModeConfirmationId);
  }, [activeModal]);

  useEffect(() => {
    if (enableMantaPayConfirm && !isZkModeEnabled && !zkModeSyncState.isSyncing) {
      handleEnableMantaPay();
    }
  }, [enableMantaPayConfirm, handleEnableMantaPay, isZkModeEnabled, zkModeSyncState.isSyncing]);

  const canDerive = useMemo((): boolean => {
    if (account) {
      if (account.isExternal) {
        return false;
      } else {
        if (account.type === 'ethereum') {
          return !!account.isMasterAccount;
        } else {
          return true;
        }
      }
    } else {
      return false;
    }
  }, [account]);

  const isZkModeAvailable = useIsMantaPayAvailable(account);

  const walletNamePrefixIcon = useMemo((): PhosphorIcon => {
    switch (signMode) {
      case AccountSignMode.LEDGER:
        return Swatches;
      case AccountSignMode.QR:
        return QrCode;
      case AccountSignMode.READ_ONLY:
        return Eye;
      case AccountSignMode.INJECTED:
        return Wallet;
      default:
        return User;
    }
  }, [signMode]);

  const onDelete = useCallback(() => {
    if (account?.address) {
      deleteAccountAction()
        .then(() => {
          setDeleting(true);
          forgetAccount(account.address)
            .then(() => {
              goHome();
            })
            .catch((e: Error) => {
              notify({
                message: e.message,
                type: 'error'
              });
            })
            .finally(() => {
              setDeleting(false);
            });
        })
        .catch((e: Error) => {
          if (e) {
            notify({
              message: e.message,
              type: 'error'
            });
          }
        });
    }
  }, [account?.address, deleteAccountAction, notify, goHome]);

  const onDerive = useCallback(() => {
    if (!account?.address) {
      return;
    }

    checkUnlock().then(() => {
      setDeriving(true);

      setTimeout(() => {
        deriveAccountV3({
          address: account.address
        }).then(() => {
          goHome();
        }).catch((e: Error) => {
          notify({
            message: e.message,
            type: 'error'
          });
        }).finally(() => {
          setDeriving(false);
        });
      }, 500);
    }).catch(() => {
      // User cancel unlock
    });
  }, [account?.address, checkUnlock, goHome, notify]);

  const onExport = useCallback(() => {
    if (account?.address) {
      navigate(`/accounts/export/${account.address}`);
    }
  }, [account?.address, navigate]);

  const onCopyAddress = useCallback(() => {
    copyToClipboard(account?.address || '');
    notify({
      message: t('Copied to clipboard')
    });
  }, [account?.address, notify, t]);

  const onUpdate: FormCallbacks<DetailFormState>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    const changeMap = convertFieldToObject<DetailFormState>(changedFields);

    if (changeMap[FormFieldName.NAME]) {
      clearTimeout(saveTimeOutRef.current);
      setSaving(true);
      saveTimeOutRef.current = setTimeout(() => {
        form.submit();
      }, 1000);
    }
  }, [form]);

  const onSubmit: FormCallbacks<DetailFormState>['onFinish'] = useCallback((values: DetailFormState) => {
    clearTimeout(saveTimeOutRef.current);
    const name = values[FormFieldName.NAME];

    if (!account || name === account.name) {
      setSaving(false);

      return;
    }

    const address = account.address;

    if (!address) {
      setSaving(false);

      return;
    }

    editAccount(account.address, name.trim())
      .catch(console.error)
      .finally(() => {
        setSaving(false);
      });
  }, [account]);

  useEffect(() => {
    if (!account) {
      goHome();
    }
  }, [account, goHome, navigate]);

  const onSwitchMantaPay = useCallback((checked: boolean, event: React.MouseEvent<HTMLButtonElement>) => {
    if (checked) {
      if (isPopup) {
        windowOpen({
          allowedPath: '/accounts/detail',
          subPath: account ? `/${account.address}` : undefined,
          params: {
            enableMantaPayConfirm: 'true'
          }
        })
          .catch(console.warn);
      } else {
        handleEnableMantaPay();
      }
    } else {
      if (!zkModeSyncState.isSyncing) {
        disableMantaPay(account?.address as string)
          .then((result) => {
            if (result) {
              dispatchMantaPayState({ type: MantaPayReducerActionType.INIT, payload: undefined });
              notify({
                message: t('ZK assets are hidden as ZK mode is disabled'),
                type: 'success',
                duration: 3
              });
            } else {
              notify({
                message: t('Something went wrong'),
                type: 'error'
              });
            }
          })
          .catch(() => {
            notify({
              message: t('Something went wrong'),
              type: 'error'
            });
          });
      } else {
        notify({
          message: t('ZK mode is syncing'),
          type: 'warning'
        });
      }
    }
  }, [account, handleEnableMantaPay, isPopup, notify, t, zkModeSyncState.isSyncing]);

  const onCloseZkModeConfirmation = useCallback(() => {
    if (!mantaPayState.loading) {
      dispatchMantaPayState({ type: MantaPayReducerActionType.REJECT_ENABLE, payload: undefined });
      inactiveModal(zkModeConfirmationId);
    }
  }, [inactiveModal, mantaPayState.loading]);

  const onOkZkModeConfirmation = useCallback((password: string) => {
    dispatchMantaPayState({ type: MantaPayReducerActionType.SET_LOADING, payload: true });
    setTimeout(() => {
      enableMantaPay({ address: account?.address as string, password })
        .then((result) => {
          if (result.success) {
            inactiveModal(zkModeConfirmationId);
            dispatchMantaPayState({ type: MantaPayReducerActionType.CONFIRM_ENABLE, payload: undefined });
          } else {
            if (result.message !== MantaPayEnableMessage.WRONG_PASSWORD) {
              notify({
                type: 'error',
                message: t(getZkErrorMessage(result.message))
              });
            }

            dispatchMantaPayState({ type: MantaPayReducerActionType.SET_ERROR_MESSAGE, payload: t(getZkErrorMessage(result.message)) });
          }
        })
        .catch((e) => {
          console.error(e);

          dispatchMantaPayState({ type: MantaPayReducerActionType.SYNC_FAIL, payload: undefined });
        });
    }, 1000);
  }, [account?.address, inactiveModal, notify, t]);

  if (!account) {
    return null;
  }

  return (
    <PageWrapper
      className={CN(className)}
      resolve={dataContext.awaitStores(['mantaPay'])}
    >
      { zkModeSyncState.isSyncing && <div className={'zk-mask'} /> }

      <Layout.WithSubHeaderOnly
        disableBack={deriving || zkModeSyncState.isSyncing}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome,
            disabled: deriving || zkModeSyncState.isSyncing
          }
        ]}
        title={t('Account details')}
      >
        <div className='body-container'>
          {/* <div className='account-qr'> */}
          {/*   <SwQRCode */}
          {/*     errorLevel='M' */}
          {/*     icon='' */}
          {/*     // iconSize={token.sizeLG * 1.5} */}
          {/*     size={token.sizeXL * 3.5} */}
          {/*     value={account.address} */}
          {/*   /> */}
          {/* </div> */}
          <Form
            className={'account-detail-form'}
            form={form}
            initialValues={{
              [FormFieldName.NAME]: account.name || ''
            }}
            name='account-detail-form'
            onFieldsChange={onUpdate}
            onFinish={onSubmit}
          >
            <Form.Item
              className={CN('account-field')}
              name={FormFieldName.NAME}
              rules={[
                {
                  message: t('Account name is required'),
                  transform: (value: string) => value.trim(),
                  required: true
                }
              ]}
              statusHelpAsTooltip={true}
            >
              <Input
                className='account-name-input'
                disabled={deriving || zkModeSyncState.isSyncing || account.isInjected}
                label={t('Account name')}
                onBlur={form.submit}
                placeholder={t('Account name')}
                prefix={(
                  <BackgroundIcon
                    backgroundColor='var(--wallet-name-icon-bg-color)'
                    className={'user-name-icon'}
                    iconColor='var(--wallet-name-icon-color)'
                    phosphorIcon={walletNamePrefixIcon}
                  />
                )}
                suffix={(
                  <Icon
                    className={CN({ loading: saving })}
                    phosphorIcon={saving ? CircleNotch : FloppyDiskBack}
                    size='sm'
                  />
                )}
              />
            </Form.Item>
          </Form>
          <div className={CN('account-field')}>
            <Field
              content={toShort(account.address, 11, 13)}
              label={t('Wallet address')}
              placeholder={t('Wallet address')}
              prefix={(
                <AccountAvatar
                  size={token.sizeMD}
                  value={account.address}
                />
              )}
              suffix={(
                <Button
                  icon={(
                    <Icon
                      phosphorIcon={CopySimple}
                      size='sm'
                    />
                  )}
                  onClick={onCopyAddress}
                  size='xs'
                  type='ghost'
                />
              )}
            />
          </div>

          {
            zkModeSyncState.isSyncing && (
              <SwAlert
                className={CN('zk-alert-area')}
                description={zkModeSyncState.progress === 100 ? t('All done, you can go back home') : t('This may take a few minutes. Please keep the app open')}
                title={zkModeSyncState.progress === 100 ? t('Zk mode is ready') : t('Zk mode is syncing: {{percent}}%', { replace: { percent: zkModeSyncState.progress || '0' } })}
                type={zkModeSyncState.progress === 100 ? 'success' : 'warning'}
              />
            )
          }

          {
            isZkModeAvailable && (
              <SettingItem
                className={CN(`zk-setting ${!zkModeSyncState.isSyncing ? 'zk-sync-margin' : ''}`)}
                leftItemIcon={(
                  <BackgroundIcon
                    backgroundColor={token['green-7']}
                    phosphorIcon={ShieldCheck}
                    size='sm'
                    weight='fill'
                  />
                )}
                name={t('Zk mode')}
                rightItem={(
                  <Switch
                    checked={isZkModeEnabled}
                    disabled={zkModeSyncState.isSyncing}
                    onClick={onSwitchMantaPay}
                  />
                )}
              />)
          }
        </div>

        <div className={CN('account-detail___action-footer')}>
          <Button
            className={CN('account-button')}
            disabled={deriving || zkModeSyncState.isSyncing || account.isInjected}
            icon={(
              <Icon
                phosphorIcon={Trash}
                weight='fill'
              />
            )}
            loading={deleting}
            onClick={onDelete}
            schema='error'
          />
          <Button
            className={CN('account-button')}
            disabled={!canDerive || zkModeSyncState.isSyncing || account.isInjected}
            icon={(
              <Icon
                phosphorIcon={GitMerge}
                weight='fill'
              />
            )}
            loading={deriving}
            onClick={onDerive}
            schema='secondary'
          >
            {t('Derive')}
          </Button>
          <Button
            className={CN('account-button')}
            disabled={account.isExternal || deriving || zkModeSyncState.isSyncing || account.isInjected}
            icon={(
              <Icon
                phosphorIcon={Export}
                weight='fill'
              />
            )}
            onClick={onExport}
            schema='secondary'
          >
            {t('Export')}
          </Button>
        </div>

        <SwModal
          className={CN('account-detail__zk-mode-confirmation')}
          closable={false}
          footer={(
            <ZkModeFooter
              error={mantaPayState.error}
              loading={mantaPayState.loading}
              onCancel={onCloseZkModeConfirmation}
              onOk={onOkZkModeConfirmation}
            />
          )}
          id={zkModeConfirmationId}
          maskClosable={false}
          title={t<string>('Enable ZK mode?')}
          wrapClassName={className}
        >
          <div className={'zk-warning__container'}>
            <div className={'zk-warning__title'}>
              <Icon
                customSize={'20px'}
                iconColor={token.colorWarning}
                phosphorIcon={Warning}
                weight={'bold'}
              />
              <div className={'zk-warning__title-text'}>{t('ZK mode requires data synchronization')}</div>
            </div>

            <div className={'zk-warning__subtitle'}>
              {t('Using the app is not advised until synchronization finishes. First-time synchronization can take up to 45 minutes or longer. Proceed?')}
            </div>
          </div>
        </SwModal>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const AccountDetail = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.account-detail-form': {
      marginTop: token.margin
    },

    '.ant-sw-screen-layout-body': {
      display: 'flex',
      flexDirection: 'column'
    },

    '.zk-mask': {
      width: '100%',
      height: '100%',
      zIndex: 3,
      position: 'absolute',
      backgroundColor: token.colorBgMask
    },

    '.body-container': {
      overflow: 'scroll',
      flex: 1,
      padding: `0 ${token.padding}px`,
      '--wallet-name-icon-bg-color': token['geekblue-6'],
      '--wallet-name-icon-color': token.colorWhite,

      '.ant-background-icon': {
        width: token.sizeMD,
        height: token.sizeMD,

        '.user-name-icon': {
          span: {
            height: token.sizeSM,
            width: token.sizeSM
          }
        }
      },

      '.account-qr': {
        marginTop: token.margin,
        marginBottom: token.marginLG,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center'
      },

      '.account-field': {
        marginBottom: token.marginXS,

        '.single-icon-only': {
          color: token['gray-4']
        },

        '.ant-input-label': {
          marginBottom: token.marginXS - 2
        },

        '.ant-input-suffix': {
          marginRight: 0,
          marginLeft: token.marginXS
        },

        '.ant-btn': {
          height: 'auto',
          marginRight: -(token.marginSM - 2)
        }
      },

      '.mb-lg': {
        marginBottom: token.marginLG
      },

      '.account-button': {
        marginBottom: token.marginXS,
        gap: token.sizeXS,
        color: token.colorTextLight1,

        '&:disabled': {
          color: token.colorTextLight1,
          opacity: 0.4
        }
      },

      [`.action-type-${ActionType.DERIVE}`]: {
        '--icon-bg-color': token['magenta-7']
      },

      [`.action-type-${ActionType.EXPORT}`]: {
        '--icon-bg-color': token['green-6']
      },

      [`.action-type-${ActionType.DELETE}`]: {
        '--icon-bg-color': token['colorError-6'],
        color: token['colorError-6'],

        '.ant-background-icon': {
          color: token.colorTextLight1
        },

        '&:disabled': {
          color: token['colorError-6'],

          '.ant-background-icon': {
            color: token.colorTextLight1
          }
        }
      }
    },

    '.account-name-input': {
      '.loading': {
        color: token['gray-5'],
        animation: 'spinner-loading 1s infinite linear'
      }
    },

    '.zk-alert-area': {
      position: 'relative',
      zIndex: 4,
      marginTop: token.margin,
      marginBottom: token.marginXS
    },

    '.zk-setting': {
      position: 'relative',
      zIndex: 4,
      marginBottom: token.marginXS,
      gap: token.sizeXS,
      color: token.colorTextLight1,

      '.ant-web3-block .ant-web3-block-right-item': {
        marginRight: 0
      }
    },

    '.zk-sync-margin': {
      marginTop: token.margin
    },

    '.zk_confirmation_modal__footer': {
      display: 'flex',
      justifyContent: 'center'
    },

    '.footer__button': {
      flexGrow: 1
    },

    '.zk-warning__title': {
      display: 'flex',
      flexDirection: 'row',
      gap: '8px',
      justifyContent: 'center',
      fontSize: token.size,
      lineHeight: token.lineHeight
    },

    '.zk-warning__title-text': {
      color: token.colorWarning,
      fontWeight: token.headingFontWeight
    },

    '.zk-warning__subtitle': {
      display: 'flex',
      justifyContent: 'center',
      textAlign: 'justify',
      marginTop: token.marginMD,
      paddingLeft: token.padding,
      paddingRight: token.padding,
      fontWeight: token.bodyFontWeight,
      color: token.colorTextTertiary
    },

    '.account-detail___action-footer': {
      backgroundColor: token.colorBgDefault,
      position: 'sticky',
      bottom: 0,
      left: 0,
      width: '100%',
      display: 'flex',
      gap: token.marginSM,
      padding: token.padding,
      paddingBottom: '33px',

      button: {
        flex: 2
      },

      'button:nth-child(1)': {
        flex: 1
      }
    }
  };
});

export default AccountDetail;
