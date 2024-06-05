// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { AlertBox, BaseModal, InfoIcon, InstructionContainer, InstructionContentType, Layout, PageWrapper } from '@subwallet/extension-web-ui/components';
import { CREATE_RETURN, REQUEST_CREATE_PASSWORD_MODAL, TERMS_OF_SERVICE_URL } from '@subwallet/extension-web-ui/constants';
import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-web-ui/constants/router';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useFocusFormItem, useNotification, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { keyringChangeMasterPassword } from '@subwallet/extension-web-ui/messaging';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { renderBaseConfirmPasswordRules, renderBasePasswordRules, simpleCheckForm } from '@subwallet/extension-web-ui/utils';
import { Button, Checkbox, Form, Icon, Input, ModalContext } from '@subwallet/react-ui';
import { RuleObject } from '@subwallet/react-ui/es/form';
import CN from 'classnames';
import { CaretLeft, CheckCircle } from 'phosphor-react';
import { Callbacks, FieldData } from 'rc-field-form/lib/interface';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

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
  const { isWebUI } = useContext(ScreenContext);
  const navigate = useNavigate();
  const previousInfo = (useLocation().state || {}) as { prevPathname: string, prevState: any };

  const { accounts } = useSelector((state: RootState) => state.accountState);

  const needMigrate = useMemo(
    () => !!accounts
      .filter((acc) => acc.address !== ALL_ACCOUNT_KEY && !acc.isExternal && !acc.isInjected)
      .filter((acc) => !acc.isMasterPassword)
      .length
    , [accounts]
  );

  const [returnPath, setReturnStorage] = useLocalStorage(CREATE_RETURN, DEFAULT_ROUTER_PATH);

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

  const instructionContents: InstructionContentType[] = useMemo(() => ([
    {
      title: 'Why do I need to enter a password?',
      description: 'For your wallet protection, SubWallet locks your wallet after 15 minutes of inactivity. You will need this password to unlock it.',
      type: isWebUI ? 'warning' : 'info'
    },
    {
      title: 'Can I recover a password?',
      description: 'The password is stored securely on your device. We will not be able to recover it for you, so make sure you remember it!',
      type: isWebUI ? 'warning' : 'info'
    }
  ]), [isWebUI]);

  const onComplete = useCallback(() => {
    if (previousInfo?.prevPathname) {
      navigate(previousInfo.prevPathname, { state: previousInfo.prevState as unknown });
    } else {
      navigate(returnPath, { state: { from: returnPath } });
      setReturnStorage(DEFAULT_ROUTER_PATH);
    }
  }, [navigate, previousInfo.prevPathname, previousInfo.prevState, returnPath, setReturnStorage]);

  const onSubmit: Callbacks<CreatePasswordFormState>['onFinish'] = useCallback((values: CreatePasswordFormState) => {
    const password = values[FormFieldName.PASSWORD];
    const checkBox = values[FormFieldName.CONFIRM_CHECKBOX];

    if (password && checkBox) {
      setLoading(true);
      keyringChangeMasterPassword({
        createNew: true,
        newPassword: password
      }).then((res) => {
        if (!res?.status) {
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
    if (needMigrate && !isWebUI) {
      activeModal(REQUEST_CREATE_PASSWORD_MODAL);
    }
  }, [activeModal, isWebUI, needMigrate]);

  const onConfirmPasswordKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      form.submit();
    }
  }, [form]);

  useFocusFormItem(form, FormFieldName.PASSWORD, !checkActive(REQUEST_CREATE_PASSWORD_MODAL));

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        rightFooterButton={!isWebUI
          ? {
            children: t('Continue'),
            onClick: form.submit,
            loading: loading,
            disabled: isDisabled,
            icon: FooterIcon
          }
          : undefined}
        showBackButton={!needMigrate}
        subHeaderIcons={[
          {
            icon: <InfoIcon />,
            onClick: openModal
          }
        ]}
        title={t('Create a password')}
      >
        <div
          className={CN('body-container', {
            '__web-ui': isWebUI
          })}
        >
          {!isWebUI && <div className='notify'>
            {t('This password can only unlock your SubWallet on this browser')}
          </div>
          }

          <div className='form-container'>
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
              {isWebUI && <Form.Item>
                <AlertBox
                  description={t('Recommended security practice')}
                  title={t('Always choose a strong password!')}
                  type={'warning'}
                />
              </Form.Item>}
              <Form.Item
                name={FormFieldName.PASSWORD}
                rules={passwordRules}
                statusHelpAsTooltip={isWebUI}
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
                statusHelpAsTooltip={isWebUI}
              >
                <Input.Password
                  onKeyDown={onConfirmPasswordKeyPress}
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
              {isWebUI && (
                <Button
                  disabled={isDisabled}
                  icon={FooterIcon}
                  loading={loading}
                  onClick={form.submit}
                >
                  {t('Continue')}
                </Button>
              )}
            </Form>
          </div>

          <div className='instruction-container'>
            {isWebUI
              ? (
                <InstructionContainer contents={instructionContents} />
              )
              : (
                <BaseModal
                  center={true}
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
                  <InstructionContainer contents={instructionContents} />
                </BaseModal>
              )}
          </div>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const CreatePassword = styled(Component)<Props>(({ theme: { extendToken, token } }: Props) => {
  return {
    '.__web-ui': {
      display: 'flex',
      justifyContent: 'center',
      gap: 16,

      '& > *': {
        flex: 1
      },

      '.form-container': {
        '.ant-btn': {
          width: '100%'
        }
      }
    },

    '.body-container': {
      padding: `0 ${token.padding}px`,
      textAlign: 'center',
      width: extendToken.twoColumnWidth,
      maxWidth: '100%',
      margin: '0 auto',

      '.page-icon': {
        display: 'flex',
        justifyContent: 'center',
        marginTop: token.margin,
        '--page-icon-color': token.colorSecondary
      },

      '.title': {
        marginTop: token.margin,
        marginBottom: token.margin * 2,
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeHeading3,
        lineHeight: token.lineHeightHeading3,
        color: token.colorTextBase
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
