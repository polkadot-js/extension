// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { canDerive } from '@polkadot/extension-base/utils';
import check from '@polkadot/extension-koni-ui/assets/check.svg';
import Link from '@polkadot/extension-koni-ui/components/Link';
import Menu from '@polkadot/extension-koni-ui/components/Menu';
import MenuDivider from '@polkadot/extension-koni-ui/components/MenuDivider';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { RootState } from '@polkadot/extension-koni-ui/stores';

interface Props extends ThemeProps {
  className?: string;
  reference: React.MutableRefObject<null>;
  toggleEdit?: () => void;
  isShowZeroBalances?: boolean;
  toggleZeroBalances?: () => void;
}

function AccountAction ({ className, isShowZeroBalances, reference, toggleEdit, toggleZeroBalances }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const currentAccount = useSelector((state: RootState) => state.currentAccount);
  const networkName = useSelector((state: RootState) => state.currentNetwork.networkName);

  return (
    <Menu
      className={className}
      reference={reference}
    >
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

      {(networkName === 'all') && !!toggleZeroBalances && (
        <>
          <MenuDivider />

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

    &:hover {
      background-color: ${theme.accountHoverBackground}
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
