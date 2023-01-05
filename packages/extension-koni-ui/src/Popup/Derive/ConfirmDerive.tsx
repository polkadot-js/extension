// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ActionContext, Button, Checkbox, Warning } from '@subwallet/extension-koni-ui/components';
import AccountInfo from '@subwallet/extension-koni-ui/components/AccountInfo';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/useGetAccountByAddress';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { deriveMultiple } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { DeriveAccount } from '@subwallet/extension-koni-ui/types/derive';
import CN from 'classnames';
import React, { useCallback, useContext, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  parentAddress: string;
  deriveAccounts: DeriveAccount[];
  isBusy: boolean;
  setIsBusy: (val: boolean) => void;
}

const ConfirmDerive = ({ className, deriveAccounts, isBusy, parentAddress, setIsBusy }: Props) => {
  const { t } = useTranslation();

  const onAction = useContext(ActionContext);

  const parentAccount = useGetAccountByAddress(parentAddress);

  const [isConnectWhenCreate, setIsConnectWhenCreate] = useState(true);
  const [error, setError] = useState('');

  const onSubmit = useCallback(async () => {
    await new Promise<void>((resolve) => {
      setIsBusy(true);

      setTimeout(() => {
        resolve();
      }, 500);
    });

    deriveMultiple({
      parentAddress: parentAddress,
      isAllowed: isConnectWhenCreate,
      items: deriveAccounts.map((item) => ({
        suri: item.suri,
        name: item.name
      }))
    }).then(() => {
      setError('');
      setIsBusy(false);
      window.localStorage.setItem('popupNavigation', '/');
      onAction('/');
    }).catch((e) => {
      console.log(e);
      setError((e as Error).message);
      setIsBusy(false);
    });
  }, [deriveAccounts, isConnectWhenCreate, onAction, parentAddress, setIsBusy]);

  return (
    <div className={CN(className)}>
      <div className={CN('body-container')}>
        <div className='items-container'>
          {
            deriveAccounts.map((item) => {
              return (
                <div
                  className={CN('item-row')}
                  key={item.address}
                >
                  <AccountInfo
                    address={item.address}
                    className='derive-account-info'
                    name={item.name}
                    parentName={parentAccount?.name}
                    showCopyBtn={false}
                    suri={item.suri}
                  />
                </div>
              );
            })
          }
        </div>
      </div>
      <div className={CN('footer-container')}>
        <Checkbox
          checked={isConnectWhenCreate}
          label={t<string>('Auto connect to all DApps after creating')}
          onChange={setIsConnectWhenCreate}
        />
        {error && (
          <Warning
            className={CN('create-derive-warning')}
            isBelowInput
            isDanger
          >
            {error}
          </Warning>
        )}
        <Button
          className='next-step-btn'
          data-button-action='create derived account'
          isBusy={isBusy}
          isDisabled={!deriveAccounts.length}
          onClick={onSubmit}
        >
          {t<string>('Create derived account')}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(styled(ConfirmDerive)(({ theme }: Props) => `
  padding: 25px 15px 15px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  .create-derive-warning {
    margin-top: 10px;
  }

  .body-container {
    flex: 1;
    position: relative;
    padding: 0 15px;
    margin: 0 -15px;
    border-bottom: solid 1px ${theme.boxBorderColor};
    overflow: auto;
    scrollbar-width: thin;

    .items-container {
      overflow-y: auto;
      padding: 0 15px;
      margin: 0 -15px;

      .item-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        cursor: pointer;
        margin-bottom: 8px;
      }

      .derive-account-info {
        padding: 2px 14px;
        border: 2px solid ${theme.borderColor2};
        border-radius: 8px;
      }
    }
  }

  .create-derive-warning {
    margin-bottom: 10px;
  }

  .footer-container {
    margin: 4px 0 5px;
  }
`));
