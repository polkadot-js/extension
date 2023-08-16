// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import CloseIcon from '@subwallet/extension-koni-ui/components/Icon/CloseIcon';
import InstructionContainer, { InstructionContentType } from '@subwallet/extension-koni-ui/components/InstructionContainer';
import { EVM_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants/account';
import { IMPORT_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import useCompleteCreateAccount from '@subwallet/extension-koni-ui/hooks/account/useCompleteCreateAccount';
import useGetDefaultAccountName from '@subwallet/extension-koni-ui/hooks/account/useGetDefaultAccountName';
import useGoBackFromCreateAccount from '@subwallet/extension-koni-ui/hooks/account/useGoBackFromCreateAccount';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useUnlockChecker from '@subwallet/extension-koni-ui/hooks/common/useUnlockChecker';
import useFocusFormItem from '@subwallet/extension-koni-ui/hooks/form/useFocusFormItem';
import useAutoNavigateToCreatePassword from '@subwallet/extension-koni-ui/hooks/router/useAutoNavigateToCreatePassword';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { createAccountSuriV2, validateMetamaskPrivateKeyV2 } from '@subwallet/extension-koni-ui/messaging';
import { FormCallbacks, ThemeProps, ValidateState } from '@subwallet/extension-koni-ui/types';
import { Button, Form, Icon, Input } from '@subwallet/react-ui';
import CN from 'classnames';
import { FileArrowDown } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

type Props = ThemeProps;

const FooterIcon = (
  <Icon
    phosphorIcon={FileArrowDown}
    weight='fill'
  />
);

const formName = 'import-private-key-form';
const fieldName = 'private-key';

interface FormState {
  [fieldName]: string;
}

const instructionContents: InstructionContentType[] = [
  {
    title: 'What is a private key?',
    description: 'A private key is like a password — a string of letters and numbers — that can be used to restore your wallet.'
  },
  {
    title: 'Is it safe to enter it into SubWallet?',
    description: 'Yes. It will be stored locally and never leave your device without your explicit permission.'
  }
];

const Component: React.FC<Props> = ({ className }: Props) => {
  useAutoNavigateToCreatePassword();

  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();
  const onComplete = useCompleteCreateAccount();
  const onBack = useGoBackFromCreateAccount(IMPORT_ACCOUNT_MODAL);
  const { isWebUI } = useContext(ScreenContext);

  const timeOutRef = useRef<NodeJS.Timer>();

  const [validateState, setValidateState] = useState<ValidateState>({});
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changed, setChanged] = useState(false);
  const [form] = Form.useForm<FormState>();
  const checkUnlock = useUnlockChecker();

  const accountName = useGetDefaultAccountName();

  // Auto-focus field
  useFocusFormItem(form, fieldName);

  const privateKey = Form.useWatch(fieldName, form);

  const onSubmit: FormCallbacks<FormState>['onFinish'] = useCallback((values: FormState) => {
    const { [fieldName]: privateKey } = values;

    checkUnlock().then(() => {
      if (privateKey?.trim()) {
        setLoading(true);
        createAccountSuriV2({
          name: accountName,
          suri: privateKey.trim(),
          isAllowed: true,
          types: [EVM_ACCOUNT_TYPE]
        })
          .then(() => {
            onComplete();
          })
          .catch((error: Error): void => {
            setValidateState({
              status: 'error',
              message: error.message
            });
          })
          .finally(() => {
            setLoading(false);
          });
      }
    })
      .catch(() => {
      // User cancel unlock
      });
  }, [accountName, checkUnlock, onComplete]);

  useEffect(() => {
    let amount = true;

    if (timeOutRef.current) {
      clearTimeout(timeOutRef.current);
    }

    if (amount) {
      if (privateKey?.trim()) {
        setValidating(true);
        setValidateState({
          status: 'validating',
          message: ''
        });

        timeOutRef.current = setTimeout(() => {
          validateMetamaskPrivateKeyV2(privateKey.trim(), [EVM_ACCOUNT_TYPE])
            .then(({ autoAddPrefix }) => {
              if (amount) {
                if (autoAddPrefix) {
                  form.setFieldValue(fieldName, `0x${privateKey}`);
                }

                setValidateState({});
              }
            })
            .catch((e: Error) => {
              if (amount) {
                setValidateState({
                  status: 'error',
                  message: e.message
                });
              }
            })
            .finally(() => {
              if (amount) {
                setValidating(false);
              }
            });
        }, 300);
      } else {
        if (changed) {
          setValidateState({
            status: 'error',
            message: t('Private key is required')
          });
        }
      }
    }

    return () => {
      amount = false;
    };
  }, [privateKey, form, changed, t]);

  const onValuesChange: FormCallbacks<FormState>['onValuesChange'] = useCallback((changedValues: Partial<FormState>) => {
    if (fieldName in changedValues) {
      setChanged(true);
    }
  }, []);

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        onBack={onBack}
        rightFooterButton={!isWebUI
          ? {
            children: validating ? t('Validating') : t('Import account'),
            icon: FooterIcon,
            onClick: form.submit,
            disabled: !privateKey || !!validateState.status,
            loading: validating || loading
          }
          : undefined}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome
          }
        ]}
        title={t<string>('Import by private key')}
      >
        <div className={CN('container', {
          '__web-ui': isWebUI
        })}
        >
          <div className='import-container'>
            <div className='description'>
              {t('To import an existing wallet, please enter the private key here')}
            </div>
            <Form
              className='form-container'
              form={form}
              name={formName}
              onFinish={onSubmit}
              onValuesChange={onValuesChange}
            >
              <Form.Item
                name={fieldName}
                validateStatus={validateState.status}
              >
                <Input.TextArea
                  className='private-key-input'
                  placeholder={t('Enter or paste private key')}
                  statusHelp={validateState.message}
                />
              </Form.Item>
              <Form.Item hidden={!isWebUI}>
                <Button
                  disabled={!privateKey || !!validateState.status}
                  icon={FooterIcon}
                  loading={validating || loading}
                  onClick={form.submit}
                >
                  {validating ? t('Validating') : t('Import account')}
                </Button>
              </Form.Item>
            </Form>
          </div>

          {isWebUI && (
            <InstructionContainer contents={instructionContents} />
          )}
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const ImportPrivateKey = styled(Component)<Props>(({ theme: { extendToken, token } }: Props) => {
  return {
    '.container': {
      '&.__web-ui': {
        display: 'flex',
        justifyContent: 'center',
        width: extendToken.twoColumnWidth,
        maxWidth: '100%',
        margin: '0 auto',

        '& > *': {
          flex: 1
        },

        '& .ant-btn': {
          width: '100%'
        }
      },

      '.import-container': {
        padding: token.padding
      },

      '.description': {
        padding: `0 ${token.padding}px`,
        fontSize: token.fontSizeHeading6,
        lineHeight: token.lineHeightHeading6,
        color: token.colorTextDescription,
        textAlign: 'center'
      },

      '.form-container': {
        marginTop: token.margin
      },

      '.private-key-input': {

        textarea: {
          resize: 'none',
          height: `${token.sizeLG * 6}px !important`
        }
      }
    }
  };
});

export default ImportPrivateKey;
