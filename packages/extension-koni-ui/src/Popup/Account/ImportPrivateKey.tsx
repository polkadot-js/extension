// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CloseIcon, Layout, PageWrapper, PrivateKeyInput } from '@subwallet/extension-koni-ui/components';
import InstructionContainer, { InstructionContentType } from '@subwallet/extension-koni-ui/components/InstructionContainer';
import { EVM_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants/account';
import { IMPORT_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useAutoNavigateToCreatePassword, useCompleteCreateAccount, useDefaultNavigate, useFocusFormItem, useGetDefaultAccountName, useGoBackFromCreateAccount, useTranslation, useUnlockChecker } from '@subwallet/extension-koni-ui/hooks';
import { createAccountSuriV2, validateMetamaskPrivateKeyV2 } from '@subwallet/extension-koni-ui/messaging';
import { FormCallbacks, ThemeProps, ValidateState } from '@subwallet/extension-koni-ui/types';
import { Button, Form, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { Eye, EyeSlash, FileArrowDown } from 'phosphor-react';
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

  // TODO: Change way validate
  const [validateState, setValidateState] = useState<ValidateState>({});
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
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

  const toggleShow = useCallback(() => {
    setShow((value) => !value);
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
        <div className={'container'}>
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
                <PrivateKeyInput
                  className='private-key-input'
                  hideText={!show}
                  label={t('Private key')}
                  placeholder={t('Enter or paste private key')}
                  statusHelp={validateState.message}
                />
              </Form.Item>
              <div className='button-container'>
                <Button
                  icon={(
                    <Icon
                      customSize={isWebUI ? '28px' : undefined}
                      phosphorIcon={show ? EyeSlash : Eye}
                      size='sm'
                    />
                  )}
                  onClick={toggleShow}
                  size='xs'
                  type='ghost'
                >
                  {show ? t('Hide private key') : t('Show private key')}
                </Button>
              </div>
              <Form.Item hidden={!isWebUI}>
                <Button
                  block
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

const ImportPrivateKey = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.container': {
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
    },

    '.web-ui-enable &': {
      '.ant-sw-screen-layout-header': {
        marginBottom: token.marginXL
      },

      '.container': {
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 820,
        margin: '0 auto',
        paddingLeft: token.padding,
        paddingRight: token.padding,
        gap: token.size
      },

      '.description': {
        paddingLeft: 0,
        paddingRight: 0,
        textAlign: 'left'
      },

      '.import-container': {
        padding: 0,
        flex: 1
      },

      '.instruction-container': {
        flex: 1
      },

      '.button-container': {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: token.marginLG
      }
    }
  };
});

export default ImportPrivateKey;
