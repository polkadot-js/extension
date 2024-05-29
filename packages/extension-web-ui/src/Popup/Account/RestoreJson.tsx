// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ResponseJsonGetAccountInfo } from '@subwallet/extension-base/background/types';
import { Layout, PageWrapper } from '@subwallet/extension-web-ui/components';
import AvatarGroup from '@subwallet/extension-web-ui/components/Account/Info/AvatarGroup';
import CloseIcon from '@subwallet/extension-web-ui/components/Icon/CloseIcon';
import InstructionContainer, { InstructionContentType } from '@subwallet/extension-web-ui/components/InstructionContainer';
import { BaseModal } from '@subwallet/extension-web-ui/components/Modal/BaseModal';
import { IMPORT_ACCOUNT_MODAL } from '@subwallet/extension-web-ui/constants/modal';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import useCompleteCreateAccount from '@subwallet/extension-web-ui/hooks/account/useCompleteCreateAccount';
import useGoBackFromCreateAccount from '@subwallet/extension-web-ui/hooks/account/useGoBackFromCreateAccount';
import useTranslation from '@subwallet/extension-web-ui/hooks/common/useTranslation';
import useUnlockChecker from '@subwallet/extension-web-ui/hooks/common/useUnlockChecker';
import useAutoNavigateToCreatePassword from '@subwallet/extension-web-ui/hooks/router/useAutoNavigateToCreatePassword';
import useDefaultNavigate from '@subwallet/extension-web-ui/hooks/router/useDefaultNavigate';
import { batchRestoreV2, jsonGetAccountInfo, jsonRestoreV2 } from '@subwallet/extension-web-ui/messaging';
import { ThemeProps, ValidateState } from '@subwallet/extension-web-ui/types';
import { isKeyringPairs$Json } from '@subwallet/extension-web-ui/utils/account/typeGuards';
import { KeyringPair$Json } from '@subwallet/keyring/types';
import { Button, Form, Icon, Input, ModalContext, SettingItem, SwList, Upload } from '@subwallet/react-ui';
import { UploadChangeParam, UploadFile } from '@subwallet/react-ui/es/upload/interface';
import AccountCard from '@subwallet/react-ui/es/web3-block/account-card';
import { KeyringPairs$Json } from '@subwallet/ui-keyring/types';
import CN from 'classnames';
import { DotsThree, FileArrowDown } from 'phosphor-react';
import React, { ChangeEventHandler, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { u8aToString } from '@polkadot/util';

type Props = ThemeProps;

const FooterIcon = (
  <Icon
    phosphorIcon={FileArrowDown}
    weight='fill'
  />
);

const modalId = 'account-json-modal';

const formName = 'restore-json-file-form';
const passwordField = 'password';

const focusPassword = () => {
  setTimeout(() => {
    const element = document.getElementById(`${formName}_${passwordField}`);

    if (element) {
      element.focus();
    }
  }, 10);
};

const selectPassword = () => {
  setTimeout(() => {
    const element = document.getElementById(`${formName}_${passwordField}`);

    if (element) {
      (element as HTMLInputElement).select();
    }
  }, 10);
};

const instructionContent: InstructionContentType[] = [
  {
    title: 'What is a JSON?',
    description: "The JSON backup file stores your account's information encrypted with the account's password. It's a second recovery method additionally to the mnemonic phrase. "
  },
  {
    title: 'How to export your JSON backup file',
    description: (
      <span>
        When you create your account directly on Polkadot-JS UI the JSON file is automatically downloaded to your Downloads folder.
        <br />
        If you create your account in the Polkadot extension, you need to manually export the JSON file.
        <br />
        In <a href='#'>this article</a> you will learn how to manually export your JSON backup file in the Polkadot extension and Polkadot-JS UI.
      </span>
    )
  }
];

function Component ({ className }: Props): JSX.Element {
  useAutoNavigateToCreatePassword();

  const { t } = useTranslation();
  const onComplete = useCompleteCreateAccount();
  const navigate = useNavigate();
  const onBack = useGoBackFromCreateAccount(IMPORT_ACCOUNT_MODAL);
  const { goHome } = useDefaultNavigate();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);

  const [form] = Form.useForm();

  const [fileValidateState, setFileValidateState] = useState<ValidateState>({});
  const [submitValidateState, setSubmitValidateState] = useState<ValidateState>({});
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [jsonFile, setJsonFile] = useState<KeyringPair$Json | KeyringPairs$Json | undefined>(undefined);
  const [accountsInfo, setAccountsInfo] = useState<ResponseJsonGetAccountInfo[]>([]);
  const checkUnlock = useUnlockChecker();

  const closeModal = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const openModal = useCallback(() => {
    activeModal(modalId);
  }, [activeModal]);

  const onChange = useCallback((info: UploadChangeParam<UploadFile<unknown>>) => {
    if (validating) {
      return;
    }

    setValidating(true);
    const uploadFile = info.file;

    uploadFile.originFileObj?.arrayBuffer()
      .then((bytes) => {
        let json: KeyringPair$Json | KeyringPairs$Json | undefined;

        try {
          json = JSON.parse(u8aToString(Uint8Array.from(Buffer.from(bytes)))) as KeyringPair$Json | KeyringPairs$Json;

          if (JSON.stringify(jsonFile) === JSON.stringify(json)) {
            setValidating(false);

            return;
          } else {
            setAccountsInfo([]);
            setPassword('');
            setJsonFile(json);
          }
        } catch (e) {
          const error = e as Error;

          setFileValidateState({
            status: 'error',
            message: error.message
          });
          setValidating(false);
          setRequirePassword(false);

          return;
        }

        try {
          setSubmitValidateState({});

          if (isKeyringPairs$Json(json)) {
            const accounts: ResponseJsonGetAccountInfo[] = json.accounts.map((account) => {
              return {
                address: account.address,
                genesisHash: account.meta.genesisHash,
                name: account.meta.name
              } as ResponseJsonGetAccountInfo;
            });

            setRequirePassword(true);
            setAccountsInfo(accounts);
            setFileValidateState({});
            setValidating(false);
          } else {
            jsonGetAccountInfo(json)
              .then((accountInfo) => {
                setRequirePassword(true);
                setAccountsInfo([accountInfo]);
                setFileValidateState({});
                setValidating(false);
              })
              .catch((e: Error) => {
                setRequirePassword(false);
                setFileValidateState({
                  status: 'error',
                  message: e.message
                });
                setValidating(false);
              });
          }
        } catch (e) {
          setFileValidateState({
            status: 'error',
            message: t<string>('Invalid JSON file')
          });
          setValidating(false);
          setRequirePassword(false);
        }
      })
      .catch((e: Error) => {
        setFileValidateState({
          status: 'error',
          message: e.message
        });
        setValidating(false);
      });
  }, [t, jsonFile, validating]);

  const onSubmit = useCallback(() => {
    if (!jsonFile) {
      return;
    }

    if (requirePassword && !password) {
      return;
    }

    checkUnlock().then(() => {
      setLoading(true);

      setTimeout(() => {
        const isMultiple = isKeyringPairs$Json(jsonFile);

        (isMultiple
          ? batchRestoreV2(jsonFile, password, accountsInfo, true)
          : jsonRestoreV2({
            file: jsonFile,
            password: password,
            address: accountsInfo[0].address,
            isAllowed: true,
            withMasterPassword: true
          }))
          .then(() => {
            setTimeout(() => {
              if (isMultiple) {
                navigate('/keyring/migrate-password');
              } else {
                onComplete();
              }
            }, 1000);
          })
          .catch((e: Error) => {
            setSubmitValidateState({
              message: e.message,
              status: 'error'
            });
            selectPassword();
          })
          .finally(() => {
            setLoading(false);
          });
      }, 500);
    }).catch(() => {
      // User cancel unlock
    });
  }, [jsonFile, requirePassword, password, checkUnlock, accountsInfo, navigate, onComplete]);

  const renderItem = useCallback((account: ResponseJsonGetAccountInfo): React.ReactNode => {
    return (
      <AccountCard
        accountName={account.name}
        address={account.address}
        addressPreLength={4}
        addressSufLength={5}
        avatarIdentPrefix={42}
        avatarTheme={account.type === 'ethereum' ? 'ethereum' : 'polkadot'}
        className='account-item'
        key={account.address}
      />
    );
  }, []);

  const onChangePassword: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    const value = event.target.value;

    if (!value) {
      setSubmitValidateState({
        message: t('Password is required'),
        status: 'error'
      });
    } else {
      setSubmitValidateState({});
    }

    setPassword(value);
  }, [t]);

  useEffect(() => {
    if (requirePassword) {
      focusPassword();
    }
  }, [requirePassword]);

  const buttonProps = {
    children: t('Import account'),
    icon: FooterIcon,
    onClick: form.submit,
    disabled: !!fileValidateState.status || !!submitValidateState.status || !password,
    loading: validating || loading
  };

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        onBack={onBack}
        rightFooterButton={!isWebUI
          ? {
            children: t('Import by JSON file'),
            icon: FooterIcon,
            onClick: form.submit,
            disabled: !!fileValidateState.status || !!submitValidateState.status || !password,
            loading: validating || loading
          }
          : undefined}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome
          }
        ]}
        title={t<string>('Import from Polkadot.{js}')}
      >
        <div className={CN('layout-container', {
          '__web-ui': isWebUI
        })}
        >
          <div className={CN('import-container')}>
            <div className='description'>
              {t('Drag and drop the JSON file you exported from Polkadot.{js}')}
            </div>
            <Form
              className='form-container'
              form={form}
              name={formName}
              onFinish={onSubmit}
            >
              <Form.Item
                validateStatus={fileValidateState.status}
              >
                <Upload.SingleFileDragger
                  accept={'application/json'}
                  className='file-selector'
                  disabled={validating}
                  hint={t('Drag and drop the JSON file you exported from Polkadot.{js}')}
                  onChange={onChange}
                  statusHelp={fileValidateState.message}
                  title={t('Import by JSON file')}
                />
              </Form.Item>
              {
                !!accountsInfo.length && (
                  <Form.Item>
                    {
                      accountsInfo.length > 1
                        ? (
                          <SettingItem
                            className='account-list-item'
                            leftItemIcon={<AvatarGroup accounts={accountsInfo} />}
                            name={t('Import {{number}} accounts', { replace: { number: String(accountsInfo.length).padStart(2, '0') } })}
                            onPressItem={openModal}
                            rightItem={(
                              <Icon
                                phosphorIcon={DotsThree}
                                size='sm'
                              />
                            )}
                          />
                        )
                        : (
                          <SettingItem
                            className='account-list-item'
                            leftItemIcon={<AvatarGroup accounts={accountsInfo} />}
                            name={accountsInfo[0].name}
                          />
                        )
                    }
                  </Form.Item>
                )
              }
              {
                requirePassword && (
                  <Form.Item
                    validateStatus={submitValidateState.status}
                  >
                    <div className='input-label'>
                      {t('Please enter the password you have used when creating your Polkadot.{js} account')}
                    </div>
                    <Input.Password
                      id={`${formName}_${passwordField}`}
                      onChange={onChangePassword}
                      placeholder={t('Password')}
                      statusHelp={submitValidateState.message}
                      type='password'
                      value={password}
                    />
                  </Form.Item>
                )
              }
              {isWebUI && (
                <Button
                  {...buttonProps}
                  className='action'
                />
              )}
            </Form>
            <BaseModal
              className={className}
              id={modalId}
              onCancel={closeModal}
              title={t('Import list')}
            >
              <SwList.Section
                displayRow={true}
                list={accountsInfo}
                renderItem={renderItem}
                rowGap='var(--row-gap)'
              />
            </BaseModal>
          </div>

          {isWebUI && (
            <InstructionContainer contents={instructionContent} />
          )}
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
}

const ImportJson = styled(Component)<Props>(({ theme: { extendToken, token } }: Props) => {
  return {
    '--row-gap': `${token.sizeXS}px`,

    '.layout-container': {
      paddingLeft: token.padding,
      paddingRight: token.padding,

      '&.__web-ui': {
        display: 'flex',
        justifyContent: 'center',
        width: extendToken.twoColumnWidth,
        maxWidth: '100%',
        gap: token.size,
        margin: '0 auto'
      },

      '.import-container': {
        paddingBottom: 0,
        flex: 1,

        '& .ant-btn': {
          width: '100%'
        }
      },

      '.instruction-container': {
        flex: 1
      }
    },
    '.description': {
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription
    },

    '.form-container': {
      marginTop: token.margin
    },

    '.ant-form-item:last-child': {
      marginBottom: 0
    },

    '.input-label': {
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription,
      marginBottom: token.margin
    },

    '.account-list-item': {
      marginTop: -token.marginXS,

      '.account-item': {
        cursor: 'default'
      },

      '.ant-web3-block-right-item': {
        marginRight: 0
      }
    },

    '.ant-web3-block': {
      display: 'flex !important'
    },

    '.ant-sw-modal-body': {
      padding: `${token.padding}px 0 ${token.padding}px`,
      flexDirection: 'column',
      display: 'flex'
    },

    '.ant-sw-list-wrapper': {
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    },

    '.file-selector': {
      '.ant-upload-drag-single': {
        height: 168
      }
    }
  };
});

export default ImportJson;
