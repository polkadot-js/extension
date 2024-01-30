// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CloseIcon, Layout, PageWrapper, PhraseNumberSelector, SeedPhraseInput } from '@subwallet/extension-web-ui/components';
import InstructionContainer, { InstructionContentType } from '@subwallet/extension-web-ui/components/InstructionContainer';
import { DEFAULT_ACCOUNT_TYPES, IMPORT_ACCOUNT_MODAL, IMPORT_SEED_MODAL, SELECTED_ACCOUNT_TYPE } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useAutoNavigateToCreatePassword, useCompleteCreateAccount, useDefaultNavigate, useFocusFormItem, useGetDefaultAccountName, useGoBackFromCreateAccount, useNotification, useTranslation, useUnlockChecker } from '@subwallet/extension-web-ui/hooks';
import { createAccountSuriV2, validateSeedV2 } from '@subwallet/extension-web-ui/messaging';
import { FormCallbacks, FormFieldData, FormRule, ThemeProps } from '@subwallet/extension-web-ui/types';
import { convertFieldToObject, noop, simpleCheckForm } from '@subwallet/extension-web-ui/utils';
import { Button, Form, Icon, Input } from '@subwallet/react-ui';
import { wordlists } from 'bip39';
import CN from 'classnames';
import { Eye, EyeSlash, FileArrowDown } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { KeypairType } from '@polkadot/util-crypto/types';

import SelectAccountType from '../../components/Account/SelectAccountType';

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
  trigger: string; // Use for trigger validate when change phraseNumber
}

const words = wordlists.english;

const instructionContent: InstructionContentType[] = [
  {
    title: 'What is a seed phrase?',
    description: 'Seed phrase is a 12- or 24-word phrase that can be used to restore your wallet.',
    type: 'warning'
  },
  {
    title: 'Is it safe to enter it into SubWallet?',
    description: 'Yes. It will be stored locally and never leave your device without your explicit permission.',
    type: 'warning'
  }
];

const Component: React.FC<Props> = ({ className }: Props) => {
  useAutoNavigateToCreatePassword();

  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();
  const { isWebUI } = useContext(ScreenContext);
  const notification = useNotification();

  const onComplete = useCompleteCreateAccount();
  const onBack = useGoBackFromCreateAccount(isWebUI ? IMPORT_ACCOUNT_MODAL : IMPORT_SEED_MODAL);

  const accountName = useGetDefaultAccountName();

  const [form] = Form.useForm<FormState>();

  const phraseNumber = Form.useWatch('phraseNumber', form);

  const [submitting, setSubmitting] = useState(false);
  const [storage] = useLocalStorage(SELECTED_ACCOUNT_TYPE, DEFAULT_ACCOUNT_TYPES);

  const [outerKeyTypes] = useState(storage);

  const [localKeyTypes, setLocalKeyTypes] = useState<KeypairType[]>(DEFAULT_ACCOUNT_TYPES);

  const keyTypes = isWebUI ? localKeyTypes : outerKeyTypes;

  const [disabled, setDisabled] = useState(true);
  const [showSeed, setShowSeed] = useState(false);
  const checkUnlock = useUnlockChecker();

  const phraseNumberItems = useMemo(() => [12, 24].map((value) => ({
    label: t('{{number}} words', { replace: { number: value } }),
    value: String(value)
  })), [t]);

  const formDefault: FormState = useMemo(() => ({
    phraseNumber: '12',
    trigger: 'trigger'
  }), []);

  const onFieldsChange: FormCallbacks<FormState>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    const { empty, error } = simpleCheckForm(allFields);

    const { phraseNumber } = convertFieldToObject<FormState>(changedFields);

    if (phraseNumber) {
      form.validateFields(['trigger']).finally(noop);
    }

    setDisabled(empty || error);
  }, [form]);

  const onFinish: FormCallbacks<FormState>['onFinish'] = useCallback((values: FormState) => {
    const { phraseNumber: _phraseNumber } = values;
    const seedKeys = Object.keys(values).filter((key) => key.startsWith(fieldNamePrefix));
    const phraseNumber = parseInt(_phraseNumber);

    if (![12, 15, 18, 21, 24].includes(seedKeys.length)) {
      throw Error(t('Mnemonic needs to contain 12, 15, 18, 21, 24 words'));
    }

    const seeds: string[] = [];

    for (let i = 0; i < phraseNumber; i++) {
      seeds.push(values[`${fieldNamePrefix}${i}`]);
    }

    if (seeds.some((value) => !value)) {
      throw Error(t('Mnemonic needs to contain 12, 15, 18, 21, 24 words'));
    }

    const seed = seeds.join(' ');

    if (seed) {
      checkUnlock()
        .then(() => {
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
        })
        .catch(() => {
          // Unlock is cancelled
        });
    }
  }, [t, checkUnlock, accountName, keyTypes, onComplete, notification]);

  const seedValidator = useCallback((rule: FormRule, value: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!value) {
        reject(new Error(t('This field is required')));
      }

      if (!words.includes(value)) {
        reject(new Error(t('Invalid word')));
      }

      resolve();
    });
  }, [t]);

  const toggleShow = useCallback(() => {
    setShowSeed((value) => !value);
  }, []);

  useFocusFormItem(form, `${fieldNamePrefix}0`);

  const buttonProps = {
    children: t('Import account'),
    icon: FooterIcon,
    onClick: form.submit,
    disabled: disabled,
    loading: submitting
  };

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        onBack={onBack}
        rightFooterButton={isWebUI ? undefined : buttonProps}
        subHeaderIcons={isWebUI
          ? undefined
          : ([
            {
              icon: <CloseIcon />,
              onClick: goHome
            }
          ])}
        title={t<string>('Import from seed phrase')}
      >
        <div className='container'>
          <div className='description'>
            {!isWebUI && t('To import an existing account,\n please enter seed phrase.')}
            { isWebUI && t('To import an existing existing account, please select account type and enter the recovery seed phrase here:')}
          </div>
          <Form
            className='form-container form-space-xs'
            form={form}
            initialValues={formDefault}
            name={formName}
            onFieldsChange={onFieldsChange}
            onFinish={onFinish}
          >
            <Form.Item name={'phraseNumber'}>
              <PhraseNumberSelector
                items={phraseNumberItems}
              />
            </Form.Item>
            <Form.Item
              hidden={true}
              name='trigger'
            >
              <Input />
            </Form.Item>
            <div className='content-container'>
              <div className='button-container'>
                <Button
                  icon={(
                    <Icon
                      customSize={isWebUI ? '28px' : undefined}
                      phosphorIcon={showSeed ? EyeSlash : Eye}
                      size='sm'
                    />
                  )}
                  onClick={toggleShow}
                  size='xs'
                  type='ghost'
                >
                  {showSeed ? t('Hide seed phrase') : t('Show seed phrase')}
                </Button>
              </div>
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
                        statusHelpAsTooltip={isWebUI}
                        validateTrigger={['onChange']}
                      >
                        <SeedPhraseInput
                          form={form}
                          formName={formName}
                          hideText={!showSeed}
                          index={index}
                          prefix={fieldNamePrefix}
                        />
                      </Form.Item>
                    );
                  })
                }
              </div>
            </div>
          </Form>

          {isWebUI && (
            <>
              <div className='__select-account-type'>
                <SelectAccountType
                  selectedItems={localKeyTypes}
                  setSelectedItems={setLocalKeyTypes}
                />
              </div>

              <Button
                {...buttonProps}
                block={true}
                className='__submit-button'
                disabled={disabled || !keyTypes.length}
              />
            </>
          )}
        </div>

        {isWebUI && (
          <InstructionContainer contents={instructionContent} />
        )}
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
      textAlign: 'center',
      whiteSpaceCollapse: 'break-spaces'
    },

    '.form-container': {
      marginTop: token.margin
    },

    '.content-container': {
      padding: token.paddingXS,
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS,
      backgroundColor: token.colorBgSecondary,
      borderRadius: token.borderRadiusLG
    },

    '.button-container': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center'
    },

    '.seed-container': {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: token.sizeXS,
      marginLeft: token.marginSM,
      marginRight: token.marginSM,

      '.ant-form-item': {
        minWidth: 0,
        marginBottom: 0
      }
    },

    '.web-ui-enable &': {
      '.ant-sw-sub-header-container': {
        marginBottom: 24
      },

      '.ant-sw-screen-layout-body': {
        maxWidth: 784,
        gap: token.size,
        width: '100%',
        flexDirection: 'row',
        marginLeft: 'auto',
        marginRight: 'auto'
      },

      '.container': {
        paddingTop: 0,
        paddingLeft: 0,
        paddingRight: 0,
        flex: 1
      },

      '.form-container': {
        marginBottom: token.margin
      },

      '.description': {
        paddingLeft: 0,
        paddingRight: 0,
        textAlign: 'left'
      },

      '.__submit-button': {
        marginTop: token.margin,
        marginBottom: token.margin
      },

      '.instruction-container': {
        flex: 1
      }
    }
  };
});

export default ImportSeedPhrase;
