// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { faUsb } from '@fortawesome/free-brands-svg-icons';
import { faCodeBranch, faFileUpload, faKey, faPlusCircle, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import { AccountContext, Link, MediaContext, Menu, MenuDivider, MenuItem } from '../components';
import useIsPopup from '../hooks/useIsPopup';
import { useLedger } from '../hooks/useLedger';
import useTranslation from '../hooks/useTranslation';
import { windowOpen } from '../messaging';

interface Props extends ThemeProps {
  className?: string;
  reference: React.MutableRefObject<null>;
}

const jsonPath = '/account/restore-json';
const ledgerPath = '/account/import-ledger';

function MenuAdd ({ className, reference }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { master } = useContext(AccountContext);
  const mediaAllowed = useContext(MediaContext);
  const { isLedgerCapable, isLedgerEnabled } = useLedger();
  const isPopup = useIsPopup();

  const _openJson = useCallback(
    () => windowOpen(jsonPath)
    , []);

  const _onOpenLedgerConnect = useCallback(
    () => windowOpen(ledgerPath),
    []
  );

  return (
    <Menu
      className={className}
      reference={reference}
    >
      <MenuItem className='menuItem'>
        <Link to={'/account/create'}>
          <FontAwesomeIcon icon={faPlusCircle} />
          <span>{ t('Create new account')}</span>
        </Link>
      </MenuItem>
      <MenuDivider />
      {!!master && (
        <>
          <MenuItem className='menuItem'>
            <Link to={`/account/derive/${master.address}`}>
              <FontAwesomeIcon icon={faCodeBranch} />
              <span>{t('Derive from an account')}</span>
            </Link>
          </MenuItem>
          <MenuDivider />
        </>
      )}
      <MenuItem className='menuItem'>
        <Link to='/account/import-seed'>
          <FontAwesomeIcon icon={faKey} />
          <span>{t<string>('Import account from pre-existing seed')}</span>
        </Link>
      </MenuItem>
      <MenuItem className='menuItem'>
        <Link
          onClick={isPopup ? _openJson : undefined}
          to={isPopup ? undefined : jsonPath}
        >
          <FontAwesomeIcon icon={faFileUpload} />
          <span>{t<string>('Restore account from backup JSON file')}</span>
        </Link>
      </MenuItem>
      <MenuDivider />
      <MenuItem className='menuItem'>
        <Link
          isDisabled={!mediaAllowed}
          title={ !mediaAllowed
            ? t<string>('Camera access must be first enabled in the settings')
            : ''
          }
          to='/account/import-qr'
        >
          <FontAwesomeIcon icon={faQrcode} />
          <span>{t<string>('Attach external QR-signer account')}</span>
        </Link>
      </MenuItem>
      <MenuItem className='menuItem ledger'>
        {isLedgerEnabled
          ? <Link
            isDisabled={!isLedgerCapable}
            title={ (!isLedgerCapable && t<string>('Ledger devices can only be connected with Chrome browser')) || ''}
            to={ledgerPath}
          >
            <FontAwesomeIcon
              icon={faUsb}
              rotation={270}
            />
            <span>{ t<string>('Attach ledger account')}</span>
          </Link>
          : <Link onClick={_onOpenLedgerConnect}>
            <FontAwesomeIcon
              icon={faUsb}
              rotation={270}
            />
            <span>{ t<string>('Connect Ledger device')}</span>
          </Link>
        }
      </MenuItem>
    </Menu>
  );
}

export default React.memo(styled(MenuAdd)(({ theme }: Props) => `
  margin-top: 50px;
  right: 50px; // 24 + 18 + 8
  user-select: none;

  .menuItem {
    span:first-child {
      height: 20px;
      margin-right: 8px;
      opacity: 0.5;
      width: 20px;
    }

    span {
      vertical-align: middle;
    }

    .svg-inline--fa {
      color: ${theme.iconNeutralColor};
      margin-right: 0.3rem;
      width: 0.875em;
    }
  }
`));
