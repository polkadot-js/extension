// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CloseIcon, Layout, PageWrapper, SeedPhraseInput, SelectAccountTypeInput } from '@subwallet/extension-koni-ui/components';
import { DEFAULT_ACCOUNT_TYPES, IMPORT_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants';
import { useAutoNavigateToCreatePassword, useCompleteCreateAccount, useDefaultNavigate, useFocusFormItem, useGetDefaultAccountName, useGoBackFromCreateAccount, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { createAccountSuriV2, validateSeedV2 } from '@subwallet/extension-koni-ui/messaging';
import { FormCallbacks, ThemeProps, ValidateState } from '@subwallet/extension-koni-ui/types';
import { Form, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { FileArrowDown } from 'phosphor-react';
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

type Props = ThemeProps;

const FooterIcon = (
  <Icon
    phosphorIcon={FileArrowDown}
    weight='fill'
  />
);

const formName = 'import-seed-phrase-form';
const fieldNamePrefix = 'seed-phrase-';
const phraseNumber = 12;

interface FormState extends Record<`seed-phrase-${number}`, string> {
  keyTypes: KeypairType[]
}

const Component: React.FC<Props> = ({ className }: Props) => {
  useAutoNavigateToCreatePassword();

  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();

  const onComplete = useCompleteCreateAccount();
  const onBack = useGoBackFromCreateAccount(IMPORT_ACCOUNT_MODAL);

  const accountName = useGetDefaultAccountName();

  const [form] = Form.useForm<FormState>();

  const [validateState, setValidateState] = useState<ValidateState>({});
  const [submitting, setSubmitting] = useState(false);

  const formDefault: FormState = useMemo(() => ({
    keyTypes: DEFAULT_ACCOUNT_TYPES
  }), []);

  const onFinish: FormCallbacks<FormState>['onFinish'] = useCallback((values: FormState) => {
    const seedKeys = Object.keys(values).filter((key) => key.startsWith(fieldNamePrefix));
    const { keyTypes } = values;

    if (![12, 15, 18, 21, 24].includes(seedKeys.length)) {
      throw Error('Mnemonic needs to contain 12, 15, 18, 21, 24 words');
    }

    const seeds: string[] = [];

    for (let i = 0; i < phraseNumber; i++) {
      seeds.push(values[`${fieldNamePrefix}${i}`]);
    }

    if (seeds.some((value) => !value)) {
      throw Error('Mnemonic needs to contain 12, 15, 18, 21, 24 words');
    }

    const seed = seeds.join(' ');

    if (seed) {
      setSubmitting(true);

      validateSeedV2(seed, DEFAULT_ACCOUNT_TYPES)
        .then(() => {
          return createAccountSuriV2({
            name: accountName,
            suri: seed,
            isAllowed: true,
            types: keyTypes
          });
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
          setSubmitting(false);
        });
    }
  }, [accountName, onComplete]);

  useFocusFormItem(form, `${fieldNamePrefix}0`);

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        onBack={onBack}
        rightFooterButton={{
          children: t('Import account'),
          icon: FooterIcon,
          onClick: form.submit,
          disabled: !!validateState.status,
          loading: submitting
        }}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome
          }
        ]}
        title={t<string>('Import from seed phrase')}
      >
        <div className='container'>
          <div className='description'>
            {t('To import an existing account, please enter seed phrase')}
          </div>
          <Form
            className='form-container'
            form={form}
            initialValues={formDefault}
            name={formName}
            onFinish={onFinish}
          >
            <div className='seed-container'>
              {
                new Array(phraseNumber).fill(null).map((value, index) => {
                  const name = fieldNamePrefix + String(index);

                  return (
                    <Form.Item
                      key={index}
                      name={name}
                      rules={[
                        {
                          required: true,
                          message: t('This field is required')
                        }
                      ]}
                      statusHelpAsTooltip={true}
                    >
                      <SeedPhraseInput
                        form={form}
                        formName={formName}
                        index={index}
                        prefix={fieldNamePrefix}
                      />
                    </Form.Item>
                  );
                })
              }
            </div>
            <Form.Item
              name='keyTypes'
            >
              <SelectAccountTypeInput
                label={t('Select account type')}
              />
            </Form.Item>
          </Form>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const ImportSeedPhrase = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.container': {
      padding: token.padding
    },

    '.ant-form-item:last-child': {
      marginBottom: 0
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

    '.seed-phrase-input': {
      textarea: {
        resize: 'none',
        height: `${token.sizeLG * 6}px !important`
      }
    },

    '.seed-container': {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      columnGap: token.size,

      '.ant-form-item': {
        minWidth: 0
      }
    }
  };
});

export default ImportSeedPhrase;
