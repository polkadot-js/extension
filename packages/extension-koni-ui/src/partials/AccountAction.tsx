/* eslint-disable */
// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, {useCallback, useRef} from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { canDerive } from '@polkadot/extension-base/utils';
import check from '@polkadot/extension-koni-ui/assets/check.svg';
import Link from '@polkadot/extension-koni-ui/components/Link';
import Menu from '@polkadot/extension-koni-ui/components/Menu';
import MenuDivider from '@polkadot/extension-koni-ui/components/MenuDivider';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { EVM_ACCOUNT_TYPE } from '@polkadot/extension-koni-ui/Popup/CreateAccount';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { isAccountAll } from '@polkadot/extension-koni-ui/util';
import { windowOpen } from '@polkadot/extension-koni-ui/messaging';
import useIsPopup from '@polkadot/extension-koni-ui/hooks/useIsPopup';

interface Props extends ThemeProps {
  className?: string;
  reference: React.MutableRefObject<null>;
  toggleEdit?: () => void;
  isShowZeroBalances?: boolean;
  toggleZeroBalances?: () => void;
  setImgSelected?: (imgSelected: string | null) => void;
}

function AccountAction ({ className, isShowZeroBalances, reference, setImgSelected, toggleEdit, toggleZeroBalances }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const inputRef: React.RefObject<HTMLInputElement> | null = useRef(null);
  const currentAccount = useSelector((state: RootState) => state.currentAccount.account);
  const isPopup = useIsPopup();
  const currentNetwork = useSelector((state: RootState) => state.currentNetwork);
  const isFirefox = window.localStorage.getItem('browserInfo') === 'Firefox';
  const isLinux = window.localStorage.getItem('osInfo') === 'Linux';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getBase64 = (file: Blob) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = function () {
      setImgSelected && setImgSelected(reader.result as string);
      localStorage.setItem('allAccountLogo', reader.result as string);
    };

    reader.onerror = function (error) {
      console.log('Error: ', error);
    };
  };

  const fileSelectedChange = useCallback(
    (event: any): void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
      getBase64(event.target.files[0]);
    }, [getBase64]);

  const onSelectImg = useCallback(() => {
    if (isPopup && (isFirefox || isLinux)) {
      windowOpen('/').catch(console.error)
    }

    inputRef.current && inputRef.current.click();
  }, []);

  return (
    <Menu
      className={className}
      reference={reference}
    >
      {currentAccount && !isAccountAll(currentAccount.address) &&
      <div>
        <div className='actions-wrapper'>
          <Link
            className='account-action__menu-item'
            onClick={toggleEdit}
          >
            {t<string>('Rename')}
          </Link>
          {!currentAccount?.isExternal && canDerive(currentAccount?.type) && (
            <Link
              className='account-action__menu-item'
              isDisabled={currentAccount.type === EVM_ACCOUNT_TYPE}
              to={`/account/derive/${currentAccount?.address}/locked`}
            >
              {t<string>('Derive New Account')}
            </Link>
          )}
        </div>

        <MenuDivider />

        <div className='actions-wrapper'>
          {!currentAccount?.isExternal && (
            <Link
              className='account-action__menu-item'
              isDanger
              to={`/account/export/${currentAccount?.address}`}
            >
              {t<string>('Export Account')}
            </Link>
          )}
          <Link
            className='account-action__menu-item'
            isDanger
            to={`/account/forget/${currentAccount?.address}`}
          >
            {t<string>('Forget Account')}
          </Link>
        </div>
      </div>
      }

      { currentAccount && isAccountAll(currentAccount.address) &&
      <div className='actions-wrapper'>
        <div
          className='account-action__menu-item'
          onClick={onSelectImg}
        >
          <input
            accept='.jpg, .jpeg, .png, .svg'
            onChange={fileSelectedChange}
            ref={inputRef}
            style={{display: 'none'}}
            type='file'
          />
          <span>{t<string>('Change All Account Avatar')}</span>
        </div>
      </div>
      }


      {(currentNetwork.networkKey === 'all') && !!toggleZeroBalances && (
        <>
          {currentAccount && !isAccountAll(currentAccount.address) &&
          <MenuDivider />
          }
          <div className='actions-wrapper'>
            <Link
              className={`account-action__menu-item account-action__show-zero-balance ${isShowZeroBalances ? '-check' : ''}`}
              onClick={toggleZeroBalances}
            >
              <span>
                {t<string>('Show Zero Balances')}
              </span>
              <img
                alt='check'
                className='account-action__check-icon'
                src={check}
              />
            </Link>
          </div>
        </>
      )}
    </Menu>
  );
}

export default React.memo(styled(AccountAction)(({ theme }: Props) => `
  top: 60px;

  .actions-wrapper {
    margin: 10px;
  }

  .account-action__menu-item {
    border-radius: 8px;
    display: block;
    font-size: 15px;
    line-height: 20px;
    margin: 0;
    padding: 10px 16px;
    cursor: pointer;
    color: ${theme.textColor2};

    &:hover {
      background-color: ${theme.accountHoverBackground};
      color: ${theme.textColor};
    }
  }

  .account-action__show-zero-balance {
    display: flex;
    align-items: center;
  }

  .account-action__check-icon {
    margin-left: 4px;
    opacity: 0;
  }

  .account-action__show-zero-balance.-check .account-action__check-icon {
    opacity: 1;
  }
`));
