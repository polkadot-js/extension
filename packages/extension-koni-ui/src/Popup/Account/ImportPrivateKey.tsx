// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { EVM_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants/account';
import useGetDefaultAccountName from '@subwallet/extension-koni-ui/hooks/account/useGetDefaultAccountName';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { createAccountSuriV2, validateMetamaskPrivateKeyV2 } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ValidateState } from '@subwallet/extension-koni-ui/types/validator';
import { Form, Icon, Input } from '@subwallet/react-ui';
import { FileArrowDown, Info } from 'phosphor-react';
import React, { ChangeEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

const FooterIcon = (
  <Icon
    customSize={'28px'}
    phosphorIcon={FileArrowDown}
    size='sm'
    weight='fill'
  />
);

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const timeOutRef = useRef<NodeJS.Timer>();
  const navigate = useNavigate();

  const [validateState, setValidateState] = useState<ValidateState>({});
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changed, setChanged] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [autoCorrect, setAutoCorrect] = useState('');

  const accountName = useGetDefaultAccountName();

  const onChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback((event) => {
    setChanged(true);
    setAutoCorrect('');
    const val = event.target.value;

    setPrivateKey(val);
  }, []);

  const onSubmit = useCallback(() => {
    if (privateKey) {
      setLoading(true);
      createAccountSuriV2({
        name: accountName,
        suri: privateKey,
        isAllowed: true,
        types: [EVM_ACCOUNT_TYPE]
      })
        .then(() => {
          navigate('/home');
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
  }, [privateKey, accountName, navigate]);

  useEffect(() => {
    let amount = true;

    if (timeOutRef.current) {
      clearTimeout(timeOutRef.current);
    }

    if (amount) {
      if (privateKey) {
        setValidating(true);
        setValidateState({
          status: 'validating',
          message: ''
        });

        timeOutRef.current = setTimeout(() => {
          validateMetamaskPrivateKeyV2(privateKey, [EVM_ACCOUNT_TYPE])
            .then(({ addressMap, autoAddPrefix }) => {
              if (amount) {
                if (autoAddPrefix) {
                  setAutoCorrect(`0x${privateKey}`);
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
            message: 'Seed phrase is required'
          });
        }
      }
    }

    return () => {
      amount = false;
    };
  }, [privateKey, changed]);

  return (
    <Layout.Base
      footerButton={{
        children: validating ? t('Validating') : t('Import account'),
        icon: FooterIcon,
        onClick: onSubmit,
        disabled: !privateKey || !!validateState.status,
        loading: validating || loading
      }}
      showBackButton={true}
      showSubHeader={true}
      subHeaderBackground='transparent'
      subHeaderCenter={true}
      subHeaderIcons={[
        {
          icon: <Icon
            phosphorIcon={Info}
            size='sm'
          />
        }
      ]}
      subHeaderPaddingVertical={true}
      title={t<string>('Import via Private Key')}
    >
      <div className={className}>
        <div className='description'>
          {t('To import an existing wallet, please enter the private key here')}
        </div>
        <Form className='form-container'>
          <Form.Item validateStatus={validateState.status}>
            <Input.TextArea
              className='private-key-input'
              onChange={onChange}
              placeholder={t('Enter or paste private key')}
              value={autoCorrect || privateKey || ''}
            />
          </Form.Item>
          <Form.Item
            help={validateState.message}
            validateStatus={validateState.status}
          />
        </Form>
      </div>
    </Layout.Base>
  );
};

const ImportPrivateKey = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    padding: token.padding,

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
  };
});

export default ImportPrivateKey;
