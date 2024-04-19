// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ResponseJsonGetAccountInfo } from '@subwallet/extension-base/background/types';
import { Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import AvatarGroup from '@subwallet/extension-koni-ui/components/Account/Info/AvatarGroup';
import CloseIcon from '@subwallet/extension-koni-ui/components/Icon/CloseIcon';
import { IMPORT_ACCOUNT_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import useCompleteCreateAccount from '@subwallet/extension-koni-ui/hooks/account/useCompleteCreateAccount';
import useGoBackFromCreateAccount from '@subwallet/extension-koni-ui/hooks/account/useGoBackFromCreateAccount';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useUnlockChecker from '@subwallet/extension-koni-ui/hooks/common/useUnlockChecker';
import useAutoNavigateToCreatePassword from '@subwallet/extension-koni-ui/hooks/router/useAutoNavigateToCreatePassword';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { batchRestoreV2, jsonGetAccountInfo, jsonRestoreV2 } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps, ValidateState } from '@subwallet/extension-koni-ui/types';
import { findNetworkJsonByGenesisHash, reformatAddress } from '@subwallet/extension-koni-ui/utils';
import { isKeyringPairs$Json } from '@subwallet/extension-koni-ui/utils/account/typeGuards';
import { KeyringPair$Json } from '@subwallet/keyring/types';
import { Form, Icon, Input, ModalContext, SettingItem, SwList, SwModal, Upload } from '@subwallet/react-ui';
import { UploadChangeParam, UploadFile } from '@subwallet/react-ui/es/upload/interface';
import AccountCard from '@subwallet/react-ui/es/web3-block/account-card';
import { KeyringPairs$Json } from '@subwallet/ui-keyring/types';
import CN from 'classnames';
import { DotsThree, FileArrowDown } from 'phosphor-react';
import React, { ChangeEventHandler, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { hexToU8a, isHex, u8aToHex, u8aToString } from '@polkadot/util';
import { ethereumEncode, keccakAsU8a, secp256k1Expand } from '@polkadot/util-crypto';

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

const Component: React.FC<Props> = ({ className }: Props) => {
  useAutoNavigateToCreatePassword();

  const { t } = useTranslation();
  const onComplete = useCompleteCreateAccount();
  const navigate = useNavigate();
  const onBack = useGoBackFromCreateAccount(IMPORT_ACCOUNT_MODAL);
  const { goHome } = useDefaultNavigate();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);

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
              const genesisHash: string = account.meta.originGenesisHash as string;

              let addressPrefix: number | undefined;

              if (account.meta.originGenesisHash) {
                addressPrefix = findNetworkJsonByGenesisHash(chainInfoMap, genesisHash)?.substrateInfo?.addressPrefix;
              }

              let address = account.address;

              if (addressPrefix !== undefined) {
                address = reformatAddress(account.address, addressPrefix);
              }

              if (isHex(account.address) && hexToU8a(account.address).length !== 20) {
                address = ethereumEncode(keccakAsU8a(secp256k1Expand(hexToU8a(account.address))));
              }

              return {
                address: address,
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
                let address = accountInfo.address;

                if (isHex(accountInfo.address) && hexToU8a(accountInfo.address).length !== 20) {
                  address = u8aToHex(keccakAsU8a(secp256k1Expand(hexToU8a(accountInfo.address))));
                }

                accountInfo.address = address;
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
  }, [validating, jsonFile, chainInfoMap, t]);

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
        addressPreLength={9}
        addressSufLength={9}
        avatarIdentPrefix={42}
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

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        onBack={onBack}
        rightFooterButton={{
          children: t('Import by JSON file'),
          icon: FooterIcon,
          onClick: form.submit,
          disabled: !!fileValidateState.status || !!submitValidateState.status || !password,
          loading: validating || loading
        }}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome
          }
        ]}
        title={t<string>('Import from Polkadot.{js}')}
      >
        <div className={CN('container')}>
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
          </Form>
          <SwModal
            className={className}
            id={modalId}
            onCancel={closeModal}
            title={t('Accounts')}
          >
            <SwList.Section
              displayRow={true}
              list={accountsInfo}
              renderItem={renderItem}
              rowGap='var(--row-gap)'
            />
          </SwModal>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const ImportJson = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '--row-gap': `${token.sizeXS}px`,

    '.container': {
      padding: token.padding,
      paddingBottom: 0
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
