// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AlertBox, Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import InfoIcon from '@subwallet/extension-koni-ui/components/Icon/InfoIcon';
import { TERMS_OF_SERVICE_URL } from '@subwallet/extension-koni-ui/constants/common';
import { REQUEST_CREATE_PASSWORD_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-koni-ui/constants/router';
import { useNotification } from '@subwallet/extension-koni-ui/hooks';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useFocusFormItem from '@subwallet/extension-koni-ui/hooks/form/useFocusFormItem';
import { keyringChangeMasterPassword } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isNoAccount } from '@subwallet/extension-koni-ui/utils/account/account';
import { simpleCheckForm } from '@subwallet/extension-koni-ui/utils/form/form';
import { renderBaseConfirmPasswordRules, renderBasePasswordRules } from '@subwallet/extension-koni-ui/utils/form/validators/password';
import { Checkbox, Form, Icon, Input, ModalContext, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { CaretLeft, CheckCircle } from 'phosphor-react';
import { Callbacks, FieldData, RuleObject } from 'rc-field-form/lib/interface';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps

enum FormFieldName {
  PASSWORD = 'password',
  CONFIRM_PASSWORD = 'confirm_password',
  CONFIRM_CHECKBOX = 'confirm_checkbox'
}

interface CreatePasswordFormState {
  [FormFieldName.PASSWORD]: string;
  [FormFieldName.CONFIRM_PASSWORD]: string;
  [FormFieldName.CONFIRM_CHECKBOX]: boolean;
}

const FooterIcon = (
  <Icon
    phosphorIcon={CheckCircle}
    weight='fill'
  />
);

const modalId = 'create-password-instruction-modal';
const formName = 'create-password-form';

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext);
  const navigate = useNavigate();
  const previousInfo = useLocation().state as { prevPathname: string, prevState: any };

  const { accounts } = useSelector((state: RootState) => state.accountState);

  const [noAccount] = useState(isNoAccount(accounts));

  const notification = useNotification();

  const passwordRules = useMemo(() => renderBasePasswordRules(t('Password'), t), [t]);
  const confirmPasswordRules = useMemo(() => renderBaseConfirmPasswordRules(FormFieldName.PASSWORD, t), [t]);
  const checkBoxValidator = useCallback((rule: RuleObject, value: boolean): Promise<void> => {
    if (!value) {
      return Promise.reject(new Error(t('CheckBox is required')));
    }

    return Promise.resolve();
  }, [t]);
  const [form] = Form.useForm<CreatePasswordFormState>();
  const [isDisabled, setIsDisable] = useState(true);

  const [loading, setLoading] = useState(false);

  const onComplete = useCallback(() => {
    if (previousInfo?.prevPathname) {
      navigate(previousInfo.prevPathname, { state: previousInfo.prevState as unknown });
    } else {
      navigate(DEFAULT_ROUTER_PATH);
    }
  }, [navigate, previousInfo?.prevPathname, previousInfo?.prevState]);

  const onSubmit: Callbacks<CreatePasswordFormState>['onFinish'] = useCallback((values: CreatePasswordFormState) => {
    const password = values[FormFieldName.PASSWORD];
    const checkBox = values[FormFieldName.CONFIRM_CHECKBOX];

    if (password && checkBox) {
      setLoading(true);
      keyringChangeMasterPassword({
        createNew: true,
        newPassword: password
      }).then((res) => {
        if (!res.status) {
          notification({
            message: res.errors[0],
            type: 'error'
          });
        } else {
          onComplete();
        }
      }).catch((e: Error) => {
        notification({
          message: e.message,
          type: 'error'
        });
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [onComplete, notification]);

  const onUpdate: Callbacks<CreatePasswordFormState>['onFieldsChange'] = useCallback((changedFields: FieldData[], allFields: FieldData[]) => {
    const { empty, error } = simpleCheckForm(allFields);

    setIsDisable(error || empty);
  }, []);

  const onChangePassword = useCallback(() => {
    form.resetFields([FormFieldName.CONFIRM_PASSWORD]);
  }, [form]);

  const openModal = useCallback(() => {
    activeModal(modalId);
  }, [activeModal]);

  const closeModal = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  useEffect(() => {
    if (!noAccount) {
      activeModal(REQUEST_CREATE_PASSWORD_MODAL);
    }
  }, [activeModal, noAccount]);

  useFocusFormItem(form, FormFieldName.PASSWORD, !checkActive(REQUEST_CREATE_PASSWORD_MODAL));

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        rightFooterButton={{
          children: t('Continue'),
          onClick: form.submit,
          loading: loading,
          disabled: isDisabled,
          icon: FooterIcon
        }}
        subHeaderIcons={[
          {
            icon: <InfoIcon />,
            onClick: openModal
          }
        ]}
        title={t('Create a password')}
      >
        <div className='body-container'>
          <div className='notify'>
            {t('This password can only unlock your SubWallet on this browser')}
          </div>
          <Form
            form={form}
            initialValues={{
              [FormFieldName.PASSWORD]: '',
              [FormFieldName.CONFIRM_PASSWORD]: '',
              [FormFieldName.CONFIRM_CHECKBOX]: ''
            }}
            name={formName}
            onFieldsChange={onUpdate}
            onFinish={onSubmit}
          >
            <Form.Item
              name={FormFieldName.PASSWORD}
              rules={passwordRules}
              statusHelpAsTooltip={true}
            >
              <Input.Password
                onChange={onChangePassword}
                placeholder={t('Enter password')}
                type='password'
              />
            </Form.Item>
            <Form.Item
              name={FormFieldName.CONFIRM_PASSWORD}
              rules={confirmPasswordRules}
              statusHelpAsTooltip={true}
            >
              <Input.Password
                placeholder={t('Confirm password')}
                type='password'
              />
            </Form.Item>
            <Form.Item>
              <div className={'annotation'}>
                {t('Passwords should be at least 8 characters in length, including letters and numbers')}
              </div>
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
                I understand that SubWallet can’t recover the password. <a
                  href={TERMS_OF_SERVICE_URL}
                  rel='noreferrer'
                  style={{ textDecoration: 'underline' }}
                  target={'_blank'}
                >Learn more.</a>
              </Checkbox>
            </Form.Item>
          </Form>
          <SwModal
            closeIcon={(
              <Icon
                phosphorIcon={CaretLeft}
                size='sm'
              />
            )}
            id={modalId}
            onCancel={closeModal}
            rightIconProps={{
              icon: <InfoIcon />
            }}
            title={t('Instructions')}
            wrapClassName={className}
          >
            <div className='instruction-container'>
              <AlertBox
                description={t('For your wallet protection, SubWallet locks your wallet after 15 minutes of inactivity. You will need this password to unlock it.')}
                title={t('Why do I need to enter a password?')}
              />
              <AlertBox
                description={t('The password is stored securely on your device. We will not be able to recover it for you, so make sure you remember it!')}
                title={t('Can I recover a password?')}
              />
            </div>
          </SwModal>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const CreatePassword = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.body-container': {
      padding: `0 ${token.padding}px`,
      textAlign: 'center',

      '.page-icon': {
        display: 'flex',
        justifyContent: 'center',
        marginTop: token.margin,
        '--page-icon-color': token.colorSecondary
      },

      '.notify': {
        marginTop: token.margin,
        marginBottom: token.margin * 2,
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSize,
        lineHeight: token.lineHeightHeading3,
        color: token.colorWarningText
      },

      '.annotation': {
        fontSize: token.fontSizeSM,
        color: token.colorTextLight5,
        textAlign: 'left'
      },
      '.form-checkbox': {
        '.checkbox': {
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center'
        }
      }
    },

    '.ant-form-item:last-child': {
      marginBottom: 0
    },

    '.instruction-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    }
  };
});

export default CreatePassword;
