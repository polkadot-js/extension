// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-koni-base/constants';
import { Layout } from '@subwallet/extension-koni-ui/components';
import { keyringMigrateMasterPassword } from '@subwallet/extension-koni-ui/messaging';
import MigrateDone from '@subwallet/extension-koni-ui/Popup/Keyring/ApplyMasterPassword/Done';
import IntroductionMigratePassword from '@subwallet/extension-koni-ui/Popup/Keyring/ApplyMasterPassword/Introduction';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toShort } from '@subwallet/extension-koni-ui/util';
import { Button, ButtonProps, Field, Form, Icon, Input } from '@subwallet/react-ui';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import CN from 'classnames';
import { ArrowCircleRight, CheckCircle, Info, Trash } from 'phosphor-react';
import { Callbacks, FieldData } from 'rc-field-form/lib/interface';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps;

type PageStep = 'Introduction' | 'Migrate' | 'Done'

enum FormFieldName {
  PASSWORD = 'password',
}

interface MigratePasswordFormState {
  [FormFieldName.PASSWORD]: string;
}

const nextIcon = (
  <Icon
    customSize={'28px'}
    phosphorIcon={ArrowCircleRight}
    weight='fill'
  />
);

const finishIcon = (
  <Icon
    customSize={'28px'}
    phosphorIcon={CheckCircle}
    weight='fill'
  />
);

const removeIcon = (
  <Icon
    customSize={'28px'}
    phosphorIcon={Trash}
  />
);

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useTheme() as Theme;

  const { accounts } = useSelector((state: RootState) => state.accountState);
  const [step, setStep] = useState<PageStep>('Introduction');
  const [form] = Form.useForm<MigratePasswordFormState>();
  const [currentAccount, setCurrentAccount] = useState<AccountJson | undefined>(undefined);
  const [isDisabled, setIsDisable] = useState(true);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const canMigrate = useMemo(
    () => accounts.filter((acc) => acc.address !== ALL_ACCOUNT_KEY && !acc.isExternal)
    , [accounts]
  );

  const needMigrate = useMemo(
    () => canMigrate.filter((acc) => !acc.isMasterPassword)
    , [canMigrate]
  );

  const onBack = useCallback(() => {
    setStep('Introduction');
  }, []);

  const onUpdate: Callbacks<MigratePasswordFormState>['onFieldsChange'] = useCallback((changedFields: FieldData[], allFields: FieldData[]) => {
    const error = allFields.map((data) => data.errors || [])
      .reduce((old, value) => [...old, ...value])
      .some((value) => !!value);

    const empty = allFields.map((data) => data.value as unknown).some((value) => !value);

    setIsDisable(error || empty);
  }, []);

  const onSubmit: Callbacks<MigratePasswordFormState>['onFinish'] = useCallback((values: MigratePasswordFormState) => {
    const password = values[FormFieldName.PASSWORD];

    if (currentAccount?.address && password) {
      setLoading(true);
      setTimeout(() => {
        keyringMigrateMasterPassword({
          address: currentAccount.address,
          password: password
        }).then((res) => {
          if (!res.status) {
            form.setFields([{ name: FormFieldName.PASSWORD, errors: [res.errors[0]] }]);
            setIsError(true);
          } else {
            form.resetFields();
            setIsError(false);
          }
        }).catch((e: Error) => {
          setIsError(true);
          form.setFields([{ name: FormFieldName.PASSWORD, errors: [e.message] }]);
        }).finally(() => {
          setLoading(false);
        });
      }, 500);
    }
  }, [currentAccount?.address, form]);

  const title = useMemo((): string => {
    const migrated = canMigrate.length - needMigrate.length;

    switch (step) {
      case 'Introduction':
        return t<string>('Apply master password');
      case 'Done':
        return t<string>('Successful');
      case 'Migrate':
        return `${String(migrated + 1).padStart(2, '0')}/${String(canMigrate.length).padStart(2, '0')}`;
      default:
        return '';
    }
  }, [t, step, needMigrate.length, canMigrate.length]);

  const footerButton = useMemo((): ButtonProps => {
    switch (step) {
      case 'Introduction':
        return {
          children: t('Next'),
          onClick: () => {
            setStep(needMigrate.length ? 'Migrate' : 'Done');
          },
          icon: nextIcon
        };
      case 'Done':
        return {
          children: t('Finish'),
          onClick: () => {
            navigate('/');
          },
          icon: finishIcon
        };
      case 'Migrate':
        return {
          children: t('Next'),
          onClick: () => {
            form.submit();
          },
          icon: nextIcon
        };
    }
  }, [form, navigate, needMigrate.length, step, t]);

  useEffect(() => {
    setStep((prevState) => {
      if (prevState !== 'Introduction') {
        return needMigrate.length ? 'Migrate' : 'Done';
      } else {
        return 'Introduction';
      }
    });
  }, [needMigrate.length]);

  useEffect(() => {
    setCurrentAccount((prevState) => {
      if (!prevState) {
        return needMigrate[0];
      } else {
        const exists = needMigrate.find((acc) => acc.address === prevState.address);

        if (exists) {
          return prevState;
        } else {
          return needMigrate[0];
        }
      }
    });
  }, [needMigrate]);

  return (
    <Layout.WithSubHeaderOnly
      className={CN(className)}
      footerButton={{
        ...footerButton,
        disabled: step === 'Migrate' && isDisabled,
        loading: step === 'Migrate' && loading
      }}
      onBack={onBack}
      showBackButton={step !== 'Introduction'}
      subHeaderIcons={[
        {
          icon: (
            <Icon
              phosphorIcon={Info}
              type='phosphor'
            />
          )
        }
      ]}
      title={title}
    >
      { step === 'Introduction' && <IntroductionMigratePassword /> }
      { step === 'Done' && <MigrateDone accounts={canMigrate} /> }
      { step === 'Migrate' && currentAccount && (
        <div className='body-container'>
          <div className='account-avatar'>
            <SwAvatar
              size={token.sizeLG * 4}
              theme={currentAccount.type === 'ethereum' ? 'ethereum' : 'polkadot'}
              value={currentAccount.address}
            />
          </div>
          <Form
            form={form}
            initialValues={{
              [FormFieldName.PASSWORD]: ''
            }}
            name='migrate-password-form'
            onFieldsChange={onUpdate}
            onFinish={onSubmit}
          >
            <Form.Item>
              <Field
                content={currentAccount.name || ''}
                label={t('Account name')}
                placeholder={t('Account name')}
              />
            </Form.Item>
            <Form.Item>
              <Field
                content={toShort(currentAccount.address || '', 15, 17)}
                label={t('Account address')}
                placeholder={t('Account address')}
              />
            </Form.Item>
            <Form.Item
              className='form-item-no-error'
              name={FormFieldName.PASSWORD}
              rules={[
                {
                  message: 'Current password is required',
                  required: true
                }
              ]}
            >
              <Input
                label={t('Current password')}
                placeholder={t('Current password')}
                type='password'
              />
            </Form.Item>
            {
              isError && (
                <Form.Item
                  className='form-item-button'
                >
                  <Button
                    icon={removeIcon}
                    type='ghost'
                  >
                    {t('Remove this account')}
                  </Button>
                </Form.Item>
              )
            }
          </Form>
        </div>
      )}
    </Layout.WithSubHeaderOnly>
  );
};

const ApplyMasterPassword = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.body-container': {
      padding: `0 ${token.padding}px`,

      '.account-avatar': {
        marginTop: token.margin,
        marginBottom: token.margin * 2,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center'
      },

      '.ant-field-content-wrapper': {
        '.ant-field-content': {
          color: token.colorTextDescription
        }
      },

      '.ant-form-item': {
        marginBottom: token.marginXS
      },

      '.form-item-no-error': {
        '.ant-form-item-explain': {
          display: 'none'
        }
      },

      '.form-item-button': {
        '.ant-form-item-control-input-content': {
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center'
        }
      }
    }
  };
});

export default ApplyMasterPassword;
