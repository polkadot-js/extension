// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import AccountAvatar from '@subwallet/extension-koni-ui/components/Account/AccountAvatar';
import useDeleteAccount from '@subwallet/extension-koni-ui/hooks/account/useDeleteAccount';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/account/useGetAccountByAddress';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { deriveAccountV3, editAccount, forgetAccount } from '@subwallet/extension-koni-ui/messaging';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { FormCallbacks } from '@subwallet/extension-koni-ui/types/form';
import { toShort } from '@subwallet/extension-koni-ui/util';
import { copyToClipboard } from '@subwallet/extension-koni-ui/util/dom';
import { BackgroundIcon, Button, Field, Form, Icon, Input, QRCode } from '@subwallet/react-ui';
import CN from 'classnames';
import { CopySimple, Export, FloppyDiskBack, Info, ShareNetwork, TrashSimple } from 'phosphor-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps;

enum FormFieldName {
  NAME = 'name'
}

interface DetailFormState {
  [FormFieldName.NAME]: string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();
  const goHome = useDefaultNavigate().goHome;
  const notify = useNotification();
  const { token } = useTheme() as Theme;
  const { accountAddress } = useParams();

  const [form] = Form.useForm<DetailFormState>();

  const account = useGetAccountByAddress(accountAddress);
  const deleteAccountAction = useDeleteAccount();

  const [deleting, setDeleting] = useState(false);
  const [deriving, setDeriving] = useState(false);

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

  const onDelete = useCallback(() => {
    if (account?.address) {
      deleteAccountAction()
        .then(() => {
          setDeleting(true);
          forgetAccount(account.address)
            .then()
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
  }, [account?.address, deleteAccountAction, notify]);

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

  const onSubmit: FormCallbacks<DetailFormState>['onFinish'] = useCallback((values: DetailFormState) => {
    const name = values[FormFieldName.NAME];

    if (!account) {
      return;
    }

    const address = account.address;

    if (!address) {
      return;
    }

    editAccount(account.address, name)
      .catch(console.error);
  }, [account]);

  useEffect(() => {
    if (!account) {
      goHome();
    }
  }, [account, goHome, navigate]);

  if (!account) {
    return null;
  }

  return (
    <Layout.WithSubHeaderOnly
      className={CN(className)}
      subHeaderIcons={[
        {
          icon: <Icon
            phosphorIcon={Info}
            size='sm'
          />
        }
      ]}
      title={t('Account detail')}
    >
      <div className='body-container'>
        <div className='account-qr'>
          <QRCode
            errorLevel='H'
            iconSize={token.sizeLG * 1.5}
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
          onFinish={onSubmit}
        >
          <Form.Item
            className={CN('account-field')}
            hideError={true}
            name={FormFieldName.NAME}
            rules={[
              {
                message: 'Wallet name is required',
                required: true
              }
            ]}
          >
            <Input
              label={t('Wallet name')}
              onBlur={form.submit}
              placeholder={t('Wallet name')}
              suffix={(
                <Button
                  icon={(
                    <Icon
                      phosphorIcon={FloppyDiskBack}
                      size='sm'
                    />
                  )}
                  size='xs'
                  type='ghost'
                />
              )}
            />
          </Form.Item>
        </Form>
        <div className={CN('account-field', 'mb-lg')}>
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
        <Button
          block={true}
          className='account-button'
          contentAlign='left'
          disabled={!canDerive}
          icon={(
            <BackgroundIcon
              backgroundColor={token['magenta-7']}
              phosphorIcon={ShareNetwork}
              size='sm'
              weight='fill'
            />
          )}
          loading={deriving}
          onClick={onDerive}
          schema='secondary'
        >
          {t('Derive account')}
        </Button>
        <Button
          block={true}
          className='account-button'
          contentAlign='left'
          disabled={account.isExternal}
          icon={(
            <BackgroundIcon
              backgroundColor={token['green-6']}
              phosphorIcon={Export}
              size='sm'
              weight='fill'
            />
          )}
          onClick={onExport}
          schema='secondary'
        >
          {t('Export account')}
        </Button>
        <Button
          block={true}
          className={CN('account-button', 'remove-button')}
          contentAlign='left'
          icon={(
            <BackgroundIcon
              backgroundColor={token.colorError}
              phosphorIcon={TrashSimple}
              size='sm'
              weight='fill'
            />
          )}
          loading={deleting}
          onClick={onDelete}
          schema='secondary'
        >
          {t('Remove account')}
        </Button>
      </div>
    </Layout.WithSubHeaderOnly>
  );
};

const AccountDetail = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.body-container': {
      padding: `0 ${token.padding}px`,

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
          marginRight: 0
        },

        '.ant-btn': {
          height: 'auto',
          marginRight: -token.marginXS
        }
      },

      '.mb-lg': {
        marginBottom: token.marginLG
      },

      '.account-button': {
        marginBottom: token.marginXS,
        gap: token.sizeXS
      },

      '.remove-button': {
        color: token.colorError,

        '.ant-background-icon': {
          color: token.colorTextBase
        }
      }
    }
  };
});

export default AccountDetail;
