// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Warning } from '@subwallet/extension-koni-ui/components';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { AddressProxy } from '@subwallet/extension-koni-ui/Popup/Sending/old/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';

import InputAddress from '../component/InputAddress';
import Password from './Password';

interface Props extends ThemeProps {
  className?: string;
  onChange: (address: AddressProxy) => void;
  onEnter?: () => void;
  passwordError: string | null;
  requestAddress: string;
}

interface PasswordState {
  isUnlockCached: boolean;
  signPassword: string;
}

function Address ({ className, onChange, onEnter, passwordError, requestAddress }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [{ isUnlockCached, signPassword }, setSignPassword] = useState<PasswordState>(() => ({
    isUnlockCached: false,
    signPassword: ''
  }));

  const signAddress = requestAddress;

  const _updatePassword = useCallback(
    (signPassword: string, isUnlockCached: boolean) => setSignPassword({ isUnlockCached, signPassword }),
    []
  );

  useEffect((): void => {
    onChange({
      isUnlockCached,
      signAddress,
      signPassword
    });
  }, [isUnlockCached, onChange, signAddress, signPassword]);

  return (
    <div className={className}>
      <InputAddress
        className='full'
        defaultValue={requestAddress}
        isDisabled
        isInput
        label={t<string>('Sending from my account')}
        withEllipsis
        withLabel
      />
      {signAddress && (
        <div className={'kn-l-password-wrapper'}>
          <Password
            address={signAddress}
            error={passwordError}
            onChange={_updatePassword}
            onEnter={onEnter}
          />
        </div>
      )}
      {passwordError && (
        <Warning
          className={'kn-l-warning'}
          isDanger
        >
          {passwordError}
        </Warning>
      )}
    </div>
  );
}

export default React.memo(styled(Address)(({ theme }: ThemeProps) => `
  .kn-l-password-wrapper {
    margin-top: 10px;
  }

  .kn-l-warning {
    margin-top: 10px;
  }
`));
