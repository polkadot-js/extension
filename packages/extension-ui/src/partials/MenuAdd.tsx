// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { faCodeBranch, faFileUpload, faKey, faPlusCircle, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import { AccountContext, Link, MediaContext, Menu, MenuDivider, MenuItem } from '../components';
import useIsPopup from '../hooks/useIsPopup';
import useTranslation from '../hooks/useTranslation';
import { windowOpen } from '../messaging';

interface Props extends ThemeProps {
  className?: string;
  reference: React.MutableRefObject<null>;
}

const jsonPath = '/account/restore-json';

function MenuAdd ({ className, reference }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { master } = useContext(AccountContext);
  const mediaAllowed = useContext(MediaContext);
  const isPopup = useIsPopup();

  const _openJson = useCallback((): void => {
    windowOpen(jsonPath).catch(console.error);
  }, []);

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
          to='/account/import-qr'
        >
          <FontAwesomeIcon icon={faQrcode} />
          <span>{t<string>('Attach external QR-signer account')}</span>
        </Link>
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
    }
  }
`));
