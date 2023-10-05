// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AlertBox, InfoIcon, InstructionContainer, InstructionContentType, Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { CREATE_RETURN, REQUEST_CREATE_PASSWORD_MODAL } from '@subwallet/extension-koni-ui/constants';
import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-koni-ui/constants/router';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useFocusFormItem, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { keyringChangeMasterPassword } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { renderBaseConfirmPasswordRules, renderBasePasswordRules, simpleCheckForm } from '@subwallet/extension-koni-ui/utils';
import { Button, Form, Icon, Input, ModalContext, PageIcon, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { CaretLeft, CheckCircle, ShieldPlus } from 'phosphor-react';
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
}

interface CreatePasswordFormState {
  [FormFieldName.PASSWORD]: string;
  [FormFieldName.CONFIRM_PASSWORD]: string;
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

  const { isNoAccount } = useSelector((state: RootState) => state.accountState);

  const [returnPath, setReturnStorage] = useLocalStorage(CREATE_RETURN, DEFAULT_ROUTER_PATH);

  const passwordRules = useMemo(() => renderBasePasswordRules(t('Password'), t), [t]);
  const confirmPasswordRules = useMemo(() => renderBaseConfirmPasswordRules(FormFieldName.PASSWORD, t), [t]);

  const [form] = Form.useForm<CreatePasswordFormState>();
  const [isDisabled, setIsDisable] = useState(true);
  const [submitError, setSubmitError] = useState('');

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
      navigate(returnPath);
      setReturnStorage(DEFAULT_ROUTER_PATH);
    }
  }, [navigate, previousInfo.prevPathname, previousInfo.prevState, returnPath, setReturnStorage]);

  const onSubmit: Callbacks<CreatePasswordFormState>['onFinish'] = useCallback((values: CreatePasswordFormState) => {
    const password = values[FormFieldName.PASSWORD];

    if (password) {
      setLoading(true);
      keyringChangeMasterPassword({
        createNew: true,
        newPassword: password
      }).then((res) => {
        if (!res?.status) {
          setSubmitError(res.errors[0]);
        } else {
          onComplete();
        }
      }).catch((e: Error) => {
        setSubmitError(e.message);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [onComplete]);

  const onUpdate: Callbacks<CreatePasswordFormState>['onFieldsChange'] = useCallback((changedFields: FieldData[], allFields: FieldData[]) => {
    const { empty, error } = simpleCheckForm(allFields);

    setSubmitError('');
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
    if (!isNoAccount && !isWebUI) {
      activeModal(REQUEST_CREATE_PASSWORD_MODAL);
    }
  }, [activeModal, isWebUI, isNoAccount]);

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
        showBackButton={isNoAccount}
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
          {!isWebUI && (
            <>
              <div className='page-icon'>
                <PageIcon
                  color='var(--page-icon-color)'
                  iconProps={{
                    weight: 'fill',
                    phosphorIcon: ShieldPlus
                  }}
                />
              </div>
              <div className='title'>{t('Create a password')}</div>
            </>
          )}

          <div className='form-container'>
            <Form
              form={form}
              initialValues={{
                [FormFieldName.PASSWORD]: '',
                [FormFieldName.CONFIRM_PASSWORD]: ''
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
                <Input
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
                <Input
                  placeholder={t('Confirm password')}
                  type='password'
                />
              </Form.Item>
              <Form.Item>
                <AlertBox
                  description={t('8 characters at least. Uppercase, numbers, and special characters are recommended.')}
                  title={t('Always choose a strong password!')}
                  type='warning'
                />
              </Form.Item>
              {submitError && (
                <Form.Item
                  help={submitError}
                  validateStatus='error'
                />
              )}
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
                  <InstructionContainer contents={instructionContents} />
                </SwModal>
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
