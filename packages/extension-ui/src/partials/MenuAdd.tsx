// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faUsb } from '@fortawesome/free-brands-svg-icons';
import { faCodeBranch, faFileExport, faFileUpload, faKey, faPlusCircle, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext } from 'react';

import { AccountContext, Link, MediaContext, Menu, MenuDivider, MenuItem } from '../components/index.js';
import { useIsPopup, useLedger, useTranslation } from '../hooks/index.js';
import { windowOpen } from '../messaging.js';
import { styled } from '../styled.js';

interface Props {
  className?: string;
  reference: React.RefObject<HTMLDivElement>;
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
    (): void => {
      windowOpen(jsonPath).catch(console.error);
    }, []
  );

  const _onOpenLedgerConnect = useCallback(
    (): void => {
      windowOpen(ledgerPath).catch(console.error);
    }, []
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
        <Link to={'/account/export-all'}>
          <FontAwesomeIcon icon={faFileExport} />
          <span>{t('Export all accounts')}</span>
        </Link>
      </MenuItem>
      <MenuItem className='menuItem'>
        <Link to='/account/import-seed'>
          <FontAwesomeIcon icon={faKey} />
          <span>{t('Import account from pre-existing seed')}</span>
        </Link>
      </MenuItem>
      <MenuItem className='menuItem'>
        <Link
          onClick={isPopup ? _openJson : undefined}
          to={isPopup ? undefined : jsonPath}
        >
          <FontAwesomeIcon icon={faFileUpload} />
          <span>{t('Restore account from backup JSON file')}</span>
        </Link>
      </MenuItem>
      <MenuDivider />
      <MenuItem className='menuItem'>
        <Link
          isDisabled={!mediaAllowed}
          title={!mediaAllowed
            ? t('Camera access must be first enabled in the settings')
            : ''
          }
          to='/account/import-qr'
        >
          <FontAwesomeIcon icon={faQrcode} />
          <span>{t('Attach external QR-signer account')}</span>
        </Link>
      </MenuItem>
      <MenuItem className='menuItem ledger'>
        {isLedgerEnabled
          ? (
            <Link
              isDisabled={!isLedgerCapable}
              title={ (!isLedgerCapable && t('Ledger devices can only be connected with Chrome browser')) || ''}
              to={ledgerPath}
            >
              <FontAwesomeIcon
                icon={faUsb}
                rotation={270}
              />
              <span>{ t('Attach ledger account')}</span>
            </Link>
          )
          : (
            <Link onClick={_onOpenLedgerConnect}>
              <FontAwesomeIcon
                icon={faUsb}
                rotation={270}
              />
              <span>{ t('Connect Ledger device')}</span>
            </Link>
          )
        }
      </MenuItem>
    </Menu>
  );
}

export default React.memo(styled(MenuAdd)<Props>`
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
      color: var(--iconNeutralColor);
      margin-right: 0.3rem;
      width: 0.875em;
    }
  }
`);
