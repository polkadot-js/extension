// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MantaPaySyncProgress } from '@subwallet/extension-base/background/KoniTypes';
import { CloseIcon, Layout, PageWrapper, ZkModeFooter } from '@subwallet/extension-koni-ui/components';
import AccountAvatar from '@subwallet/extension-koni-ui/components/Account/AccountAvatar';
import useDeleteAccount from '@subwallet/extension-koni-ui/hooks/account/useDeleteAccount';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/account/useGetAccountByAddress';
import useGetAccountSignModeByAddress from '@subwallet/extension-koni-ui/hooks/account/useGetAccountSignModeByAddress';
import { useIsMantaPayEnabled } from '@subwallet/extension-koni-ui/hooks/account/useIsMantaPayEnabled';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { deriveAccountV3, editAccount, enableMantaPay, forgetAccount, subscribeMantaPaySyncProgress, windowOpen } from '@subwallet/extension-koni-ui/messaging';
import { PhosphorIcon, Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { AccountSignMode } from '@subwallet/extension-koni-ui/types/account';
import { FormCallbacks, FormFieldData } from '@subwallet/extension-koni-ui/types/form';
import { toShort } from '@subwallet/extension-koni-ui/utils';
import { copyToClipboard } from '@subwallet/extension-koni-ui/utils/common/dom';
import { convertFieldToObject } from '@subwallet/extension-koni-ui/utils/form/form';
import { BackgroundIcon, Button, Field, Form, Icon, Input, ModalContext, SettingItem, SwAlert, Switch, SwModal, SwQRCode } from '@subwallet/react-ui';
import CN from 'classnames';
import { CircleNotch, CopySimple, Export, Eye, FloppyDiskBack, QrCode, ShareNetwork, ShieldCheck, Swatches, TrashSimple, User, Warning } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

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
  isEnabled: boolean,
  isSyncing: boolean,
  shouldShowConfirmation: boolean,
  syncProgress: MantaPaySyncProgress,
  loading: boolean
}

const DEFAULT_MANTA_PAY_STATE: MantaPayState = {
  isEnabled: false,
  isSyncing: false,
  shouldShowConfirmation: true,
  syncProgress: {
    isDone: false,
    progress: 0
  },
  loading: false
};

export enum MantaPayReducerActionType {
  INIT = 'INIT',
  SET_SHOULD_SHOW_CONFIRMATION = 'SET_SHOULD_SHOW_CONFIRMATION',
  SET_MANTA_PAY_ENABLED = 'SET_MANTA_PAY_ENABLED',
  SET_IS_SYNCING_STATE = 'SET_IS_SYNCING_STATE',
  CONFIRM_ENABLE = 'CONFIRM_ENABLE',
  REJECT_ENABLE = 'REJECT_ENABLE',
  SYNC_FAIL = 'SYNC_FAIL',
  SET_SYNC_PROGRESS = 'SET_SYNC_PROGRESS',
  SET_SYNC_FINISHED = 'SET_SYNC_FINISHED',
  SET_LOADING = 'SET_LOADING'
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
    case MantaPayReducerActionType.SET_IS_SYNCING_STATE:
      return {
        ...state,
        isSyncing: payload as boolean
      };
    case MantaPayReducerActionType.SET_MANTA_PAY_ENABLED:
      return {
        ...state,
        isEnabled: payload as boolean
      };
    case MantaPayReducerActionType.CONFIRM_ENABLE:
      return {
        ...state,
        isEnabled: true,
        isSyncing: true,
        shouldShowConfirmation: false,
        loading: false
      };
    case MantaPayReducerActionType.REJECT_ENABLE:
      return {
        ...state,
        shouldShowConfirmation: false,
        isEnabled: false,
        isSyncing: false
      };
    case MantaPayReducerActionType.SYNC_FAIL:
      return {
        ...state,
        shouldShowConfirmation: false,
        isEnabled: false,
        isSyncing: false
      };
    case MantaPayReducerActionType.SET_SYNC_PROGRESS:
      return {
        ...state,
        syncProgress: payload as MantaPaySyncProgress
      };
    case MantaPayReducerActionType.SET_SYNC_FINISHED:
      return {
        ...state,
        isSyncing: false,
        syncProgress: payload as MantaPaySyncProgress
      };
    case MantaPayReducerActionType.SET_LOADING:
      return {
        ...state,
        loading: payload as boolean
      };
    default:
      throw new Error("Can't handle action");
  }
};

const zkModeConfirmationId = 'zkModeConfirmation';

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

  const enableMantaPayConfirm = searchParams.get('enableMantaPayConfirm') === 'true';

  const [form] = Form.useForm<DetailFormState>();

  const account = useGetAccountByAddress(accountAddress);
  const deleteAccountAction = useDeleteAccount();

  const saveTimeOutRef = useRef<NodeJS.Timer>();

  const [deleting, setDeleting] = useState(false);
  const [deriving, setDeriving] = useState(false);
  const [saving, setSaving] = useState(false);

  const signMode = useGetAccountSignModeByAddress(accountAddress);

  const _isMantaPayEnabled = useIsMantaPayEnabled(accountAddress || '');

  const [mantaPayState, dispatchMantaPayState] = useReducer(mantaPayReducer, { ...DEFAULT_MANTA_PAY_STATE, isEnabled: _isMantaPayEnabled });

  const handleEnableMantaPay = useCallback(() => {
    activeModal(zkModeConfirmationId);
  }, [activeModal]);

  useEffect(() => {
    if (enableMantaPayConfirm) {
      handleEnableMantaPay();
    }
  }, [enableMantaPayConfirm, handleEnableMantaPay]);

  useEffect(() => {
    let isRun = true;

    if (mantaPayState.isSyncing && isRun) {
      subscribeMantaPaySyncProgress((data) => {
        if (data.isDone) {
          dispatchMantaPayState({ type: MantaPayReducerActionType.SET_SYNC_FINISHED, payload: data });
        } else {
          dispatchMantaPayState({ type: MantaPayReducerActionType.SET_SYNC_PROGRESS, payload: data });
        }
      })
        .catch(console.error);
    }

    return () => {
      isRun = false;
    };
  }, [mantaPayState.isSyncing]);

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

  const walletNamePrefixIcon = useMemo((): PhosphorIcon => {
    switch (signMode) {
      case AccountSignMode.LEDGER:
        return Swatches;
      case AccountSignMode.QR:
        return QrCode;
      case AccountSignMode.READ_ONLY:
        return Eye;
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
  }, [account?.address, goHome, notify]);

  const onExport = useCallback(() => {
    if (account?.address) {
      navigate(`/accounts/export/${account.address}`);
    }
  }, [account?.address, navigate]);

  const onCopyAddress = useCallback(() => {
    copyToClipboard(account?.address || '');
    notify({
      message: 'Copied'
    });
  }, [account?.address, notify]);

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
      windowOpen({
        allowedPath: '/accounts/detail',
        subPath: account ? `/${account.address}` : undefined,
        params: {
          enableMantaPayConfirm: 'true'
        }
      })
        .catch(console.warn);
    }
  }, [account]);

  const onCloseZkModeConfirmation = useCallback(() => {
    dispatchMantaPayState({ type: MantaPayReducerActionType.REJECT_ENABLE, payload: undefined });
    inactiveModal(zkModeConfirmationId);
  }, [inactiveModal]);

  const onOkZkModeConfirmation = useCallback((password: string) => {
    dispatchMantaPayState({ type: MantaPayReducerActionType.SET_LOADING, payload: true });
    setTimeout(() => {
      enableMantaPay({ address: account?.address as string, password })
        .then((result) => {
          if (result) {
            inactiveModal(zkModeConfirmationId);
          }

          dispatchMantaPayState({ type: MantaPayReducerActionType.CONFIRM_ENABLE, payload: undefined });
        })
        .catch((e) => {
          console.error(e);

          dispatchMantaPayState({ type: MantaPayReducerActionType.SYNC_FAIL, payload: undefined });
        });
    }, 1000);
  }, [account?.address, inactiveModal]);

  if (!account) {
    return null;
  }

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        disableBack={deriving || mantaPayState.isSyncing}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome,
            disabled: deriving || mantaPayState.isSyncing
          }
        ]}
        title={t('Account details')}
      >
        <div className='body-container'>
          <div className='account-qr'>
            <SwQRCode
              errorLevel='M'
              icon=''
              // iconSize={token.sizeLG * 1.5}
              size={token.sizeXL * 3.5}
              value={account.address}
            />
          </div>
          <Form
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
                  message: 'Wallet name is required',
                  transform: (value: string) => value.trim(),
                  required: true
                }
              ]}
              statusHelpAsTooltip={true}
            >
              <Input
                className='account-name-input'
                disabled={deriving}
                label={t('Wallet name')}
                onBlur={form.submit}
                placeholder={t('Wallet name')}
                prefix={(
                  <BackgroundIcon
                    backgroundColor='var(--wallet-name-icon-bg-color)'
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
            (mantaPayState.isSyncing || mantaPayState.syncProgress.isDone) && (
              <SwAlert
                className={CN('alert-area')}
                description={mantaPayState.syncProgress.isDone ? t('All done, you can go back home') : t('This may take a few minutes, keep this app open for faster sync')}
                title={mantaPayState.syncProgress.isDone ? t('Zk balance is ready') : t(`Zk balance is syncing: ${mantaPayState.syncProgress.progress}%`)}
                type={mantaPayState.syncProgress.isDone ? 'success' : 'warning'}
              />
            )
          }
          <SettingItem
            className={CN(`zk-setting ${!mantaPayState.isSyncing ? 'zk-sync-margin' : ''}`)}
            leftItemIcon={(
              <BackgroundIcon
                backgroundColor={token['green-6']}
                phosphorIcon={ShieldCheck}
                size='sm'
                weight='fill'
              />
            )}
            name={t('Zk mode')}
            rightItem={(
              <Switch
                checked={mantaPayState.isEnabled}
                onClick={onSwitchMantaPay}
              />
            )}
          />
          <Button
            block={true}
            className={CN('account-button', `action-type-${ActionType.DERIVE}`)}
            contentAlign='left'
            disabled={!canDerive}
            icon={(
              <BackgroundIcon
                backgroundColor='var(--icon-bg-color)'
                phosphorIcon={ShareNetwork}
                size='sm'
                weight='fill'
              />
            )}
            loading={deriving}
            onClick={onDerive}
            schema='secondary'
          >
            {t('Derive an account')}
          </Button>
          <Button
            block={true}
            className={CN('account-button', `action-type-${ActionType.EXPORT}`)}
            contentAlign='left'
            disabled={account.isExternal || deriving}
            icon={(
              <BackgroundIcon
                backgroundColor='var(--icon-bg-color)'
                phosphorIcon={Export}
                size='sm'
                weight='fill'
              />
            )}
            onClick={onExport}
            schema='secondary'
          >
            {t('Export this account')}
          </Button>
          <Button
            block={true}
            className={CN('account-button', `action-type-${ActionType.DELETE}`)}
            contentAlign='left'
            disabled={deriving}
            icon={(
              <BackgroundIcon
                backgroundColor='var(--icon-bg-color)'
                phosphorIcon={TrashSimple}
                size='sm'
                weight='fill'
              />
            )}
            loading={deleting}
            onClick={onDelete}
            schema='secondary'
          >
            {t('Remove this account')}
          </Button>
        </div>

        <SwModal
          className={CN('account-detail__zk-mode-confirmation')}
          footer={(
            <ZkModeFooter
              loading={mantaPayState.loading}
              onCancel={onCloseZkModeConfirmation}
              onOk={onOkZkModeConfirmation}
            />
          )}
          id={zkModeConfirmationId}
          title={t<string>('Confirmation')}
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
              <div className={'zk-warning__title-text'}>{t('Zk mode requires data synchronization')}</div>
            </div>

            <div className={'zk-warning__subtitle'}>
              {t('You will not be able to use the app until the synchronization is finished. This process can take up to 45 minutes or longer, are you sure to do this?')}
            </div>
          </div>
        </SwModal>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const AccountDetail = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.body-container': {
      padding: `0 ${token.padding}px`,
      '--wallet-name-icon-bg-color': token['geekblue-6'],
      '--wallet-name-icon-color': token.colorWhite,

      '.ant-background-icon': {
        width: token.sizeMD,
        height: token.sizeMD,

        '.anticon': {
          height: token.sizeSM,
          width: token.sizeSM
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

    '.alert-area': {
      marginTop: token.margin,
      marginBottom: token.marginXS
    },

    '.zk-setting': {
      marginBottom: token.marginXS,
      gap: token.sizeXS,
      color: token.colorTextLight1
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
    }
  };
});

export default AccountDetail;
