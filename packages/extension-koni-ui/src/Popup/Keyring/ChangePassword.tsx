// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CloseIcon, Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { TERMS_OF_SERVICE_URL } from '@subwallet/extension-koni-ui/constants';
import { useDefaultNavigate, useFocusFormItem, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { keyringChangeMasterPassword } from '@subwallet/extension-koni-ui/messaging';
import { FormCallbacks, FormFieldData, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { renderBaseConfirmPasswordRules, renderBasePasswordRules, simpleCheckForm } from '@subwallet/extension-koni-ui/utils';
import { Checkbox, Form, Icon, Input, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { FloppyDiskBack, ShieldCheck } from 'phosphor-react';
import { RuleObject } from 'rc-field-form/lib/interface';
import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps

enum FormFieldName {
  PASSWORD = 'password',
  OLD_PASSWORD = 'old_password',
  CONFIRM_PASSWORD = 'confirm_password',
  CONFIRM_CHECKBOX = 'confirm_checkbox'
}

interface ChangePasswordFormState {
  [FormFieldName.PASSWORD]: string;
  [FormFieldName.OLD_PASSWORD]: string;
  [FormFieldName.CONFIRM_PASSWORD]: string;
  [FormFieldName.CONFIRM_CHECKBOX]: boolean;
}

const formName = 'change-password-form';

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { goHome } = useDefaultNavigate();

  const [form] = Form.useForm<ChangePasswordFormState>();
  const [isDisabled, setIsDisable] = useState(true);
  const [submitError, setSubmitError] = useState('');

  const [loading, setLoading] = useState(false);

  const newPasswordRules = useMemo(() => renderBasePasswordRules(t('New password'), t), [t]);
  const confirmPasswordRules = useMemo(() => renderBaseConfirmPasswordRules(FormFieldName.PASSWORD, t), [t]);
  const checkBoxValidator = useCallback((rule: RuleObject, value: boolean): Promise<void> => {
    if (!value) {
      return Promise.reject(new Error(t('CheckBox is required')));
    }

    return Promise.resolve();
  }, [t]);

  const goBack = useCallback(() => {
    navigate('/settings/security');
  }, [navigate]);

  const onSubmit: FormCallbacks<ChangePasswordFormState>['onFinish'] = useCallback((values: ChangePasswordFormState) => {
    const password = values[FormFieldName.PASSWORD];
    const oldPassword = values[FormFieldName.OLD_PASSWORD];
    const checkBox = values[FormFieldName.CONFIRM_CHECKBOX];

    if (password && oldPassword && checkBox) {
      setLoading(true);
      setTimeout(() => {
        keyringChangeMasterPassword({
          createNew: false,
          newPassword: password,
          oldPassword: oldPassword
        }).then((res) => {
          if (!res.status) {
            form.setFields([{ name: FormFieldName.OLD_PASSWORD, errors: res.errors }]);
          } else {
            goHome();
          }
        }).catch((e: Error) => {
          form.setFields([{ name: FormFieldName.OLD_PASSWORD, errors: [e.message] }]);
        }).finally(() => {
          setLoading(false);
        });
      }, 1000);
    }
  }, [form, goHome]);

  const onUpdate: FormCallbacks<ChangePasswordFormState>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    const { empty, error } = simpleCheckForm(allFields);

    setSubmitError('');
    setIsDisable(error || empty);
  }, []);

  const onChangePassword = useCallback(() => {
    form.resetFields([FormFieldName.CONFIRM_PASSWORD]);
  }, [form]);

  useFocusFormItem(form, FormFieldName.OLD_PASSWORD);

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        onBack={goBack}
        rightFooterButton={{
          children: t('Save'),
          onClick: form.submit,
          loading: loading,
          disabled: isDisabled,
          icon: (
            <Icon
              phosphorIcon={FloppyDiskBack}
              weight='fill'
            />
          )
        }}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome
          }
        ]}
        title={t('Change password')}
      >
        <div className='body-container'>
          <div className='page-icon'>
            <PageIcon
              color='var(--page-icon-color)'
              iconProps={{
                weight: 'fill',
                phosphorIcon: ShieldCheck
              }}
            />
          </div>
          <div className='title'>
            {t('Change your password')}
          </div>
          <Form
            form={form}
            initialValues={{
              [FormFieldName.OLD_PASSWORD]: '',
              [FormFieldName.PASSWORD]: '',
              [FormFieldName.CONFIRM_PASSWORD]: '',
              [FormFieldName.CONFIRM_CHECKBOX]: ''
            }}
            name={formName}
            onFieldsChange={onUpdate}
            onFinish={onSubmit}
          >
            <Form.Item
              name={FormFieldName.OLD_PASSWORD}
              rules={[
                {
                  message: t('Password is required'),
                  required: true
                }
              ]}
              statusHelpAsTooltip={true}
            >
              <Input.Password
                disabled={loading}
                placeholder={t('Current password')}
                type='password'
              />
            </Form.Item>
            <Form.Item
              name={FormFieldName.PASSWORD}
              rules={newPasswordRules}
              statusHelpAsTooltip={true}
            >
              <Input.Password
                disabled={loading}
                onChange={onChangePassword}
                placeholder={t('New password')}
                type='password'
              />
            </Form.Item>
            <Form.Item
              name={FormFieldName.CONFIRM_PASSWORD}
              rules={confirmPasswordRules}
              statusHelpAsTooltip={true}
            >
              <Input.Password
                disabled={loading}
                placeholder={t('Confirm new password')}
                type='password'
              />
            </Form.Item>
            <Form.Item
              className={'form-checkbox'}
              name={FormFieldName.CONFIRM_CHECKBOX}
              rules={[
                {
                  validator: checkBoxValidator
                }
              ]}
              statusHelpAsTooltip={true}
              valuePropName={'checked'}
            >
              <Checkbox
                className={'checkbox'}
              >
                {t('I understand that SubWallet can’t recover the password.')}
                <a
                  href={TERMS_OF_SERVICE_URL}
                  rel='noreferrer'
                  style={{ textDecoration: 'underline' }}
                  target={'_blank'}
                >Learn more.</a>
              </Checkbox>
            </Form.Item>
            <Form.Item
              help={submitError}
              validateStatus={submitError && 'error'}
            />
          </Form>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const ChangePassword = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.body-container': {
      padding: `0 ${token.padding}px`,
      textAlign: 'center',

      '.page-icon': {
        display: 'flex',
        justifyContent: 'center',
        marginTop: token.marginSM,
        '--page-icon-color': token.colorSecondary
      },

      '.form-checkbox': {
        '.checkbox': {
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center'
        }
      },
      '.ant-form-item-explain-connected': {
        paddingBottom: 0
      },

      '.title': {
        marginTop: token.margin,
        marginBottom: token.margin * 2,
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeHeading3,
        lineHeight: token.lineHeightHeading3,
        color: token.colorTextBase
      }
    }
  };
});

export default ChangePassword;
