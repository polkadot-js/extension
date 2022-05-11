// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import InputAddress from '@polkadot/extension-koni-ui/components/InputAddress';
import Warning from '@polkadot/extension-koni-ui/components/Warning';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { AddressProxy, ThemeProps } from '@polkadot/extension-koni-ui/types';

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
        className='auth-transaction-input-address'
        defaultValue={requestAddress}
        isDisabled
        isInput
        label={t<string>('Sending from my account')}
        withEllipsis
        withLabel
      />
      {/* {signAddress && ( */}
      <div className={'sending-address-password-wrapper'}>
        <Password
          address={signAddress}
          error={passwordError}
          onChange={_updatePassword}
          onEnter={onEnter}
        />
      </div>
      {/* )} */}
      {passwordError && (
        <Warning
          className={'sending-address-warning'}
          isDanger
        >
          {passwordError}
        </Warning>
      )}
    </div>
  );
}

export default React.memo(styled(Address)(({ theme }: ThemeProps) => `
  .sending-address-password-wrapper {
    margin-top: 10px;
  }

  .sending-address-warning {
    margin-top: 10px;
  }

  .auth-transaction-input-address {
    border-radius: 8px;
    border: 2px dashed ${theme.boxBorderColor};
    height: 72px;
  }
`));
