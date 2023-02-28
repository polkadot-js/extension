// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import AlertBox from '@subwallet/extension-koni-ui/components/Alert';
import { renderBaseConfirmPasswordRules, renderBasePasswordRules } from '@subwallet/extension-koni-ui/constants/rules';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { keyringChangeMasterPassword } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Form, Icon, Input, ModalContext, SwModal } from '@subwallet/react-ui';
import PageIcon from '@subwallet/react-ui/es/page-icon';
import CN from 'classnames';
import { CaretLeft, CheckCircle, Info, ShieldPlus } from 'phosphor-react';
import { Callbacks, FieldData } from 'rc-field-form/lib/interface';
import React, { useCallback, useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

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

const passwordRules = renderBasePasswordRules('Password');
const confirmPasswordRules = renderBaseConfirmPasswordRules(FormFieldName.PASSWORD);

const modalId = 'create-password-instruction-modal';

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const navigate = useNavigate();
  const goHome = useDefaultNavigate().goHome;
  const previousInfo = useLocation().state as {prevPathname: string, prevState: any};

  const [form] = Form.useForm<CreatePasswordFormState>();
  const [isDisabled, setIsDisable] = useState(true);
  const [submitError, setSubmitError] = useState('');

  const [loading, setLoading] = useState(false);

  const onSubmit: Callbacks<CreatePasswordFormState>['onFinish'] = useCallback((values: CreatePasswordFormState) => {
    const password = values[FormFieldName.PASSWORD];

    if (password) {
      setLoading(true);
      keyringChangeMasterPassword({
        createNew: true,
        newPassword: password
      }).then((res) => {
        if (!res.status) {
          setSubmitError(res.errors[0]);
        } else {
          if (previousInfo?.prevPathname) {
            navigate(previousInfo.prevPathname, { state: previousInfo.prevState as unknown });
          } else {
            goHome();
          }
        }
      }).catch((e: Error) => {
        setSubmitError(e.message);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [goHome, navigate, previousInfo.prevPathname, previousInfo.prevState]);

  const onUpdate: Callbacks<CreatePasswordFormState>['onFieldsChange'] = useCallback((changedFields: FieldData[], allFields: FieldData[]) => {
    const error = allFields.map((data) => data.errors || [])
      .reduce((old, value) => [...old, ...value])
      .some((value) => !!value);

    const empty = allFields.map((data) => data.value as unknown).some((value) => !value);

    setSubmitError('');
    setIsDisable(error || empty);
  }, []);

  const onChangePassword = useCallback(() => {
    form.setFields([{ name: FormFieldName.CONFIRM_PASSWORD, value: '', errors: [] }]);
  }, [form]);

  const openModal = useCallback(() => {
    activeModal(modalId);
  }, [activeModal]);

  const closeModal = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  return (
    <Layout.Base
      className={CN(className)}
      rightFooterButton={{
        children: t('Continue'),
        onClick: form.submit,
        loading: loading,
        disabled: isDisabled,
        icon: FooterIcon
      }}
      showBackButton={true}
      showSubHeader={true}
      subHeaderBackground='transparent'
      subHeaderCenter={true}
      subHeaderIcons={[
        {
          icon: (
            <Icon
              phosphorIcon={Info}
              size='sm'
            />
          ),
          onClick: openModal
        }
      ]}
      subHeaderPaddingVertical={true}
      title={t('Create a password')}
    >
      <div className='body-container'>
        <div className='page-icon'>
          <PageIcon
            color='var(--page-icon-color)'
            iconProps={{
              weight: 'fill',
              phosphorIcon: ShieldPlus
            }}
          />
        </div>
        <div className='title'>
          {t('Create a password')}
        </div>
        <Form
          form={form}
          initialValues={{
            [FormFieldName.PASSWORD]: '',
            [FormFieldName.CONFIRM_PASSWORD]: ''
          }}
          name='create-password-form'
          onFieldsChange={onUpdate}
          onFinish={onSubmit}
        >
          <Form.Item
            className='form-item-no-error'
            name={FormFieldName.PASSWORD}
            rules={passwordRules}
          >
            <Input
              onChange={onChangePassword}
              placeholder={t('Enter password')}
              type='password'
            />
          </Form.Item>
          <Form.Item
            className='form-item-no-error'
            name={FormFieldName.CONFIRM_PASSWORD}
            rules={confirmPasswordRules}
          >
            <Input
              placeholder={t('Confirm password')}
              type='password'
            />
          </Form.Item>
          <Form.Item>
            <AlertBox
              description={t('Recommended security practice')}
              title={t('Always choose a strong password!')}
              type='warning'
            />
          </Form.Item>
          <Form.Item
            help={submitError}
            validateStatus={submitError && 'error'}
          />
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
            icon: (
              <Icon
                phosphorIcon={Info}
                size='sm'
              />
            )
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
    </Layout.Base>
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

      '.title': {
        marginTop: token.margin,
        marginBottom: token.margin * 2,
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeHeading3,
        lineHeight: token.lineHeightHeading3,
        color: token.colorTextBase
      },

      '.form-item-no-error': {
        '.ant-form-item-explain': {
          display: 'none'
        }
      }
    },

    '.instruction-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    }
  };
});

export default CreatePassword;
