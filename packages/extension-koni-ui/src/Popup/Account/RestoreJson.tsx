// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ResponseJsonGetAccountInfo } from '@subwallet/extension-base/background/types';
import { Layout } from '@subwallet/extension-koni-ui/components';
import AvatarGroup from '@subwallet/extension-koni-ui/components/Account/Info/AvatarGroup';
import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-koni-ui/constants/router';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { batchRestoreV2, jsonGetAccountInfo, jsonRestoreV2 } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ValidateState } from '@subwallet/extension-koni-ui/types/validator';
import { isKeyringPairs$Json } from '@subwallet/extension-koni-ui/util/typeGuards';
import { KeyringPair$Json } from '@subwallet/keyring/types';
import { Form, Icon, Input, ModalContext, SettingItem, SwList, SwModal, Upload } from '@subwallet/react-ui';
import { UploadChangeParam, UploadFile } from '@subwallet/react-ui/es/upload/interface';
import AccountCard from '@subwallet/react-ui/es/web3-block/account-card';
import { KeyringPairs$Json } from '@subwallet/ui-keyring/types';
import CN from 'classnames';
import { DotsThree, FileArrowDown, Info } from 'phosphor-react';
import React, { ChangeEventHandler, useCallback, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { u8aToString } from '@polkadot/util';

type Props = ThemeProps;

const FooterIcon = (
  <Icon
    customSize={'28px'}
    phosphorIcon={FileArrowDown}
    size='sm'
    weight='fill'
  />
);

const modalId = 'account-json-modal';

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const [fileValidateState, setFileValidateState] = useState<ValidateState>({});
  const [submitValidateState, setSubmitValidateState] = useState<ValidateState>({});
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [jsonFile, setJsonFile] = useState<KeyringPair$Json | KeyringPairs$Json | undefined>(undefined);
  const [accountsInfo, setAccountsInfo] = useState<ResponseJsonGetAccountInfo[]>([]);

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
      // setFileError(false);
      // setIsPasswordError(false);
      // setPassword('');
      // setAccountsInfo(() => []);
        let json: KeyringPair$Json | KeyringPairs$Json | undefined;

        try {
          json = JSON.parse(u8aToString(Uint8Array.from(Buffer.from(bytes)))) as KeyringPair$Json | KeyringPairs$Json;

          if (JSON.stringify(jsonFile) === JSON.stringify(json)) {
            setValidating(false);

            return;
          } else {
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

          return;
        }

        try {
          setRequirePassword(true);
          setPassword('');
          setSubmitValidateState({});

          if (isKeyringPairs$Json(json)) {
            const accounts: ResponseJsonGetAccountInfo[] = json.accounts.map((account) => {
              return {
                address: account.address,
                genesisHash: account.meta.genesisHash,
                name: account.meta.name
              } as ResponseJsonGetAccountInfo;
            });

            setAccountsInfo(accounts);

            setFileValidateState({});
            setValidating(false);
          } else {
            jsonGetAccountInfo(json)
              .then((accountInfo) => {
                setAccountsInfo([accountInfo]);
                setFileValidateState({});
                setValidating(false);
              })
              .catch((e: Error) => {
                setFileValidateState({
                  status: 'error',
                  message: e.message
                });
              });
          }
        } catch (e) {
          setFileValidateState({
            status: 'error',
            message: t<string>('Invalid Json file')
          });
          setValidating(false);
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

    setLoading(true);

    setTimeout(() => {
      (isKeyringPairs$Json(jsonFile)
        ? batchRestoreV2(jsonFile, password, accountsInfo, true)
        : jsonRestoreV2({
          file: jsonFile,
          password: password,
          address: accountsInfo[0].address,
          isAllowed: true,
          withMasterPassword: true
        }))
        .then(() => {
          navigate(DEFAULT_ROUTER_PATH);
        })
        .catch((e: Error) => {
          setSubmitValidateState({
            message: e.message,
            status: 'error'
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }, 500);
  }, [accountsInfo, jsonFile, navigate, password, requirePassword]);

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
        isSelected={true}
        key={account.address}
      />
    );
  }, []);

  const onChangePassword: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    const value = event.target.value;

    setSubmitValidateState({});
    setPassword(value);
  }, []);

  return (
    <Layout.Base
      footerButton={{
        children: t('Import from Json'),
        icon: FooterIcon,
        onClick: onSubmit,
        disabled: !!fileValidateState.status || !!fileValidateState.status,
        loading: validating || loading
      }}
      showBackButton={true}
      showSubHeader={true}
      subHeaderBackground='transparent'
      subHeaderCenter={true}
      subHeaderIcons={[
        {
          icon: (
            <Icon
              phosphorIcon={Info}
              size='sm'
            />
          )
        }
      ]}
      subHeaderPaddingVertical={true}
      title={t<string>('Import from Json')}
    >
      <div className={CN(className, 'container')}>
        <div className='description'>
          {t('Please drag an drop the .json file you exported from Polkadot.js')}
        </div>
        <Form className='form-container'>
          <Form.Item
            validateStatus={fileValidateState.status}
          >
            <Upload.SingleFileDragger
              accept={'application/JSON'}
              disabled={validating}
              hint={t('Please drag an drop the .json file you exported from Polkadot.js')}
              onChange={onChange}
              title={t('Import from Polkadot.js')}
            />
          </Form.Item>
          {
            !!accountsInfo.length && (
              <Form.Item>
                <SettingItem
                  className='account-list-item'
                  leftItemIcon={<AvatarGroup accounts={accountsInfo} />}
                  name={t(`Import ${String(accountsInfo.length).padStart(2, '0')} accounts`)}
                  onPressItem={openModal}
                  rightItem={(
                    <Icon
                      phosphorIcon={DotsThree}
                      size='sm'
                    />
                  )}
                />
              </Form.Item>
            )
          }

          {
            requirePassword && (
              <Form.Item
                validateStatus={submitValidateState.status}
              >
                <div className='input-label'>
                  {t('Please enter the password you set when creating your polkadot.js account')}
                </div>
                <Input
                  onChange={onChangePassword}
                  placeholder={t('Current password')}
                  type='password'
                  value={password}
                />
              </Form.Item>
            )
          }

          <Form.Item
            help={fileValidateState.message}
            validateStatus={fileValidateState.status}
          />
          <Form.Item
            help={submitValidateState.message}
            validateStatus={submitValidateState.status}
          />
        </Form>
        <SwModal
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
        </SwModal>
      </div>
    </Layout.Base>
  );
};

const ImportJson = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '--row-gap': token.sizeXS,

    '&.container': {
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
    },

    '.input-label': {
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription,
      marginBottom: token.margin
    },

    '.account-list-item': {
      marginTop: -token.marginXS,

      '.ant-web3-block-right-item': {
        marginRight: 0
      }
    },

    '.ant-web3-block': {
      display: 'flex !important'
    }
  };
});

export default ImportJson;
