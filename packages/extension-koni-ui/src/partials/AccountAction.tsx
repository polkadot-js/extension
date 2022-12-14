/* eslint-disable */
// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import Link from '@subwallet/extension-koni-ui/components/Link';
import Menu from '@subwallet/extension-koni-ui/components/Menu';
import MenuDivider from '@subwallet/extension-koni-ui/components/MenuDivider';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { isAccountAll } from '@subwallet/extension-koni-ui/util';
import { IconMaps } from '@subwallet/extension-koni-ui/assets/icon';

interface Props extends ThemeProps {
  className?: string;
  isShowZeroBalances?: boolean;
  openExportModal: () => void;
  openMigrateModal: () => void;
  reference: React.MutableRefObject<null>;
  setImgSelected?: (imgSelected: string | null) => void;
  toggleEdit?: () => void;
  toggleZeroBalances?: () => void;
}

function AccountAction ({ className, isShowZeroBalances, reference, setImgSelected, toggleEdit, toggleZeroBalances, openExportModal, openMigrateModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const currentAccount = useSelector((state: RootState) => state.currentAccount.account);
  const currentNetwork = useSelector((state: RootState) => state.currentNetwork);

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
        {!currentAccount?.isExternal && !currentAccount?.isMasterPassword && (
          <>
            <MenuDivider />
            <div className='actions-wrapper'>
              <div
                className='account-action__menu-item migrate-item'
                onClick={openMigrateModal}
              >
                {t<string>('Apply master password')}
              </div>
            </div>
          </>
        )}
        {currentAccount?.isMasterAccount && (
          <>
            <MenuDivider />
            <div className='actions-wrapper'>
              <div
                className='account-action__menu-item'
                onClick={openExportModal}
              >
                {t<string>('Export seed phrase')}
              </div>
            </div>
          </>
        )}
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
              <div className='account-action__check-icon'>
                {IconMaps.check}
              </div>
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
    margin: 8px;
  }

  .account-action__menu-item {
    border-radius: 8px;
    display: block;
    font-size: 15px;
    line-height: 26px;
    width: 200px;
    margin: 0;
    padding: 6px 12px;
    cursor: pointer;
    color: ${theme.textColor2};

    &.migrate-item {
      color: ${theme.buttonBackground2};
      position: relative;

      &:after {
        content: '';
        position: absolute;
        top: 0px;
        right: 4px;
        width: 8px;
        height: 8px;
        border: 1px solid ${theme.buttonBackgroundDanger};
        border-radius: 8px;
      }
      &:before {
        content: '';
        position: absolute;
        top: 2px;
        right: 6px;
        width: 4px;
        height: 4px;
        background: ${theme.buttonBackgroundDanger};
        border-radius: 4px;
      }
    }

    &:hover {
      background-color: ${theme.accountHoverBackground};
      color: ${theme.textColor};

      &.migrate-item {
        color: ${theme.buttonBackground2};
      }
    }
  }

  .account-action__show-zero-balance {
    display: flex;
    align-items: center;
  }

  .account-action__check-icon {
    margin-left: 4px;
    opacity: 0;
    color: ${theme.primaryColor}
  }

  .account-action__show-zero-balance.-check .account-action__check-icon {
    opacity: 1;
  }
`));
