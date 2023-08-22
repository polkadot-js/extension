// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CloseIcon, Layout, PageWrapper, PhraseNumberSelector, SeedPhraseInput } from '@subwallet/extension-koni-ui/components';
import { DEFAULT_ACCOUNT_TYPES, IMPORT_SEED_MODAL, SELECTED_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants';
import { useAutoNavigateToCreatePassword, useCompleteCreateAccount, useDefaultNavigate, useFocusFormItem, useGetDefaultAccountName, useGoBackFromCreateAccount, useNotification, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { createAccountSuriV2, validateSeedV2 } from '@subwallet/extension-koni-ui/messaging';
import { FormCallbacks, FormRule, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Form, Icon } from '@subwallet/react-ui';
import { wordlists } from 'bip39';
import CN from 'classnames';
import { FileArrowDown } from 'phosphor-react';
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps;

const FooterIcon = (
  <Icon
    phosphorIcon={FileArrowDown}
    weight='fill'
  />
);

const formName = 'import-seed-phrase-form';
const fieldNamePrefix = 'seed-phrase-';

interface FormState extends Record<`seed-phrase-${number}`, string> {
  phraseNumber: string;
}

const words = wordlists.english;

const Component: React.FC<Props> = ({ className }: Props) => {
  useAutoNavigateToCreatePassword();

  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();
  const notification = useNotification();

  const onComplete = useCompleteCreateAccount();
  const onBack = useGoBackFromCreateAccount(IMPORT_SEED_MODAL);

  const accountName = useGetDefaultAccountName();

  const [form] = Form.useForm<FormState>();

  const phraseNumber = Form.useWatch('phraseNumber', form);

  const [submitting, setSubmitting] = useState(false);
  const [storage] = useLocalStorage(SELECTED_ACCOUNT_TYPE, DEFAULT_ACCOUNT_TYPES);

  const [keyTypes] = useState(storage);

  const phraseNumberItems = useMemo(() => [12, 24].map((value) => ({
    label: t('{{number}} words', { replace: { number: value } }),
    value: String(value)
  })), [t]);

  const formDefault: FormState = useMemo(() => ({
    phraseNumber: '12'
  }), []);

  const onFinish: FormCallbacks<FormState>['onFinish'] = useCallback((values: FormState) => {
    const { phraseNumber: _phraseNumber } = values;
    const seedKeys = Object.keys(values).filter((key) => key.startsWith(fieldNamePrefix));
    const phraseNumber = parseInt(_phraseNumber);

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
          notification({
            type: 'error',
            message: error.message
          });
        })
        .finally(() => {
          setSubmitting(false);
        });
    }
  }, [accountName, keyTypes, notification, onComplete]);

  const seedValidator = useCallback((rule: FormRule, value: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!value) {
        reject(new Error(t('This field is required')));
      }

      if (!words.includes(value)) {
        reject(new Error(t('Word is invalid')));
      }

      resolve();
    });
  }, [t]);

  useFocusFormItem(form, `${fieldNamePrefix}0`);

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        onBack={onBack}
        rightFooterButton={{
          children: t('Import account'),
          icon: FooterIcon,
          onClick: form.submit,
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
            <Form.Item name={'phraseNumber'}>
              <PhraseNumberSelector
                items={phraseNumberItems}
              />
            </Form.Item>
            <div className='seed-container'>
              {
                new Array(parseInt(phraseNumber || '12')).fill(null).map((value, index) => {
                  const name = fieldNamePrefix + String(index);

                  return (
                    <Form.Item
                      key={index}
                      name={name}
                      rules={[{
                        validator: seedValidator
                      }]}
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
