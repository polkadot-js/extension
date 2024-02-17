// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FormCallbacks, FormFieldData, ThemeProps } from '@subwallet/extension-web-ui/types';
import { simpleCheckForm } from '@subwallet/extension-web-ui/utils';
import { Button, Form, Icon, Input } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, XCircle } from 'phosphor-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useFocusById from '../../hooks/form/useFocusById';

interface Props extends ThemeProps {
  onOk: (password: string) => void;
  onCancel: () => void;
  loading: boolean;
  error?: string;
}

interface ZkFormState {
  password: string;
}

const passwordInputId = 'zk-confirm-password';

const Component: React.FC<Props> = (props: Props) => {
  const { className, error, loading, onCancel, onOk } = props;
  const [form] = Form.useForm<ZkFormState>();
  const [isDisabled, setIsDisabled] = useState(false);
  const { t } = useTranslation();

  const onUpdate: FormCallbacks<ZkFormState>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    const { empty, error } = simpleCheckForm(allFields);

    setIsDisabled(error || empty);
  }, []);

  const onError = useCallback((error: string) => {
    form.setFields([{ name: 'password', errors: [error] }]);
    (document.getElementById(passwordInputId) as HTMLInputElement)?.select();
  }, [form]);

  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  useFocusById(passwordInputId);

  const onSubmit = useCallback(() => {
    form.validateFields(['password'])
      .then((validatedData) => {
        onOk(validatedData.password);
      })
      .catch(console.error);
  }, [form, onOk]);

  const onClickCancel = useCallback(() => {
    form.resetFields(['password']);
    onCancel();
  }, [form, onCancel]);

  return (
    <div className={CN(`${className || ''}`)}>
      <Form
        form={form}
        initialValues={{ password: '' }}
        onFieldsChange={onUpdate}
        onFinish={onSubmit}
      >
        <div className={'zk_confirmation_modal__input_label'}>{t('Enter password to confirm')}</div>
        <Form.Item
          name={'password'}
          rules={[
            {
              message: t('Password is required'),
              required: true
            }
          ]}
          statusHelpAsTooltip={true}
        >
          <Input.Password
            containerClassName='password-input'
            id={passwordInputId}
            placeholder={t('Password')}
          />
        </Form.Item>
      </Form>
      <div className={'zk_confirmation_modal__footer'}>
        <Button
          className={'footer__button'}
          disabled={loading}
          icon={(
            <Icon
              phosphorIcon={XCircle}
              weight='fill'
            />
          )}
          onClick={onClickCancel}
          schema={'secondary'}
        >
          {t('Cancel')}
        </Button>

        <Button
          className={'footer__button'}
          disabled={isDisabled}
          icon={(
            <Icon
              phosphorIcon={CheckCircle}
              weight='fill'
            />
          )}
          loading={loading}
          onClick={form.submit}
        >
          {t('Enable')}
        </Button>
      </div>
    </div>
  );
};

const ZkModeFooter = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.zk_confirmation_modal__input_label': {
      display: 'flex',
      justifyContent: 'flex-start',
      marginBottom: token.margin,
      fontWeight: token.bodyFontWeight,
      color: token.colorTextTertiary,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6
    }
  };
});

export default ZkModeFooter;
