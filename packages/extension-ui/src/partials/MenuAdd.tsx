// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../types';

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import fileIcon from '../assets/file-upload.svg';
import plusIcon from '../assets/plus.svg';
import qrIcon from '../assets/qr.svg';
import seedIcon from '../assets/secret.svg';
import { AccountContext, Link, MediaContext, Menu, MenuDivider, MenuItem, Svg } from '../components';
import useTranslation from '../hooks/useTranslation';
import { jsonRestoreWindowOpen } from '../messaging';

interface Props extends ThemeProps {
  className?: string;
  reference: React.MutableRefObject<null>;
}

const isPopup = window.innerWidth <= 480;

function MenuAdd ({ className, reference }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { master } = useContext(AccountContext);
  const mediaAllowed = useContext(MediaContext);

  const _openJson = useCallback((): void => {
    jsonRestoreWindowOpen().catch(console.error);
  }, []);

  return (
    <Menu
      className={className}
      reference={reference}
    >
      <MenuItem className='menuItem'>
        <Link to={master ? `/account/derive/${master.address}` : '/account/create'}>
          <Svg src={plusIcon} />
          <span>{
            master
              ? t('Create new account (root or derived)')
              : t('Create new account')
          }</span>
        </Link>
      </MenuItem>
      <MenuDivider />
      <MenuItem className='menuItem'>
        <Link to='/account/import-seed'>
          <Svg src={seedIcon} />
          <span>{t<string>('Import account from pre-existing seed')}</span>
        </Link>
      </MenuItem>
      <MenuItem className='menuItem'>
        <Link
          onClick={isPopup ? _openJson : undefined}
          to={isPopup ? undefined : '/account/restore-json'}
        >
          <Svg src={fileIcon} />
          <span>{t<string>('Restore account from backup JSON file')}</span>
        </Link>
      </MenuItem>
      <MenuDivider />
      <MenuItem className='menuItem'>
        <Link
          isDisabled={!mediaAllowed}
          to='/account/import-qr'
        >
          <Svg src={qrIcon} />
          <span>{t<string>('Attach external QR-signer account')}</span>
        </Link>
      </MenuItem>
    </Menu>
  );
}

export default React.memo(styled(MenuAdd)`
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
  }
`);
