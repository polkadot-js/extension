// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import SelectAccountType from '@subwallet/extension-koni-ui/components/Account/SelectAccountType';
import { EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants/account';
import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-koni-ui/constants/router';
import useGetDefaultAccountName from '@subwallet/extension-koni-ui/hooks/account/useGetDefaultAccountName';
import useAutoNavigateToCreatePassword from '@subwallet/extension-koni-ui/hooks/router/autoNavigateToCreatePassword';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { createAccountSuriV2, validateSeedV2 } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ValidateState } from '@subwallet/extension-koni-ui/types/validator';
import { Form, Icon, Input } from '@subwallet/react-ui';
import { FileArrowDown, Info } from 'phosphor-react';
import React, { ChangeEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

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
  useAutoNavigateToCreatePassword();

  const { t } = useTranslation();
  const timeOutRef = useRef<NodeJS.Timer>();
  const navigate = useNavigate();

  const accountName = useGetDefaultAccountName();

  const [keyTypes, setKeyTypes] = useState<KeypairType[]>([SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE]);
  const [validateState, setValidateState] = useState<ValidateState>({});
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [changed, setChanged] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');

  const onChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback((event) => {
    setChanged(true);
    const val = event.target.value;

    setSeedPhrase(val);
  }, []);

  const onSubmit = useCallback(() => {
    if (seedPhrase) {
      setSubmitting(true);
      createAccountSuriV2({
        name: accountName,
        suri: seedPhrase,
        isAllowed: true,
        types: keyTypes
      })
        .then(() => {
          navigate(DEFAULT_ROUTER_PATH);
        })
        .catch((error: Error): void => {
          setValidateState({
            status: 'error',
            message: error.message
          });
        })
        .finally(() => {
          setSubmitting(false);
        });
    }
  }, [seedPhrase, accountName, keyTypes, navigate]);

  useEffect(() => {
    let amount = true;

    if (timeOutRef.current) {
      clearTimeout(timeOutRef.current);
    }

    if (amount) {
      if (seedPhrase) {
        setValidating(true);
        setValidateState({
          status: 'validating',
          message: ''
        });

        timeOutRef.current = setTimeout(() => {
          validateSeedV2(seedPhrase, [SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE])
            .then((res) => {
              if (amount) {
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
  }, [seedPhrase, changed]);

  return (
    <Layout.Base
      rightFooterButton={{
        children: validating ? t('Validating') : t('Import account'),
        icon: FooterIcon,
        onClick: onSubmit,
        disabled: !seedPhrase || !!validateState.status,
        loading: validating || submitting
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
      title={t<string>('Import from seed phrase')}
    >
      <div className={className}>
        <div className='description'>
          {t('To import an existing Polkdot wallet, please enter the recovery seed phrase here:')}
        </div>
        <Form className='form-container'>
          <Form.Item validateStatus={validateState.status}>
            <Input.TextArea
              className='seed-phrase-input'
              onChange={onChange}
              placeholder={t('Secret phrase')}
            />
          </Form.Item>
          <Form.Item>
            <SelectAccountType
              selectedItems={keyTypes}
              setSelectedItems={setKeyTypes}
              withLabel={true}
            />
          </Form.Item>
          <Form.Item
            help={validateState.message}
            validateStatus={validateState.status}
          />
        </Form>

        {/* <Checkbox className='checkbox'>{t('Import multiple accounts from this seed phrase')}</Checkbox> */}
      </div>
    </Layout.Base>
  );
};

const ImportSeedPhrase = styled(Component)<Props>(({ theme: { token } }: Props) => {
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

    '.seed-phrase-input': {
      textarea: {
        resize: 'none',
        height: `${token.sizeLG * 6}px !important`
      }
    }
  };
});

export default ImportSeedPhrase;
