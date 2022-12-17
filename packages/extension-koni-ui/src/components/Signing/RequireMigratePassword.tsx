// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import MigrateMasterPasswordModal from '@subwallet/extension-koni-ui/components/Modal/MigrateMasterPasswordModal';
import { SIGN_MODE } from '@subwallet/extension-koni-ui/constants/signing';
import useGetAccountByAddress from '@subwallet/extension-koni-ui/hooks/useGetAccountByAddress';
import { useGetSignMode } from '@subwallet/extension-koni-ui/hooks/useGetSignMode';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps{
  className?: string;
  address?: string;
}

const RequireMigratePassword = ({ address, className }: Props) => {
  const { t } = useTranslation();

  const account = useGetAccountByAddress(address);

  const signMode = useGetSignMode(account);

  const [isVisible, setIsVisible] = useState<boolean>(signMode === SIGN_MODE.PASSWORD && !account?.isMasterPassword);

  const onOpenModal = useCallback(() => {
    setIsVisible(true);
  }, []);

  const onCloseModal = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    const visible = signMode === SIGN_MODE.PASSWORD && !account?.isMasterPassword;

    if (visible) {
      setIsVisible(true);
    }
  }, [signMode, account]);

  return (
    <div className={CN(className)}>
      {
        signMode === SIGN_MODE.PASSWORD && !account?.isMasterPassword && (
          <div className='migrate-notification'>
            <span>
              {t<string>('To continue, please apply the master password')}&nbsp;
            </span>
            <span
              className='highlight-migrate'
              onClick={onOpenModal}
            >
              {t('Migrate now')}
            </span>
          </div>
        )
      }
      {
        isVisible && (
          <MigrateMasterPasswordModal
            address={address}
            className='migrate-modal'
            closeModal={onCloseModal}
          />
        )
      }
    </div>
  );
};

export default React.memo(styled(RequireMigratePassword)(({ theme }: Props) => `
  .migrate-notification {
    font-style: normal;
    font-weight: 500;
    font-size: 15px;
    line-height: 26px;
    color: ${theme.textColor2};
    margin-bottom: 8px;

    .highlight-migrate {
      text-decoration: underline;
      cursor: pointer;
      color: ${theme.buttonTextColor2};
    }
  }
`));
