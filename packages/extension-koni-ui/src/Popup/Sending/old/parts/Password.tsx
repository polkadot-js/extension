// Copyright 2017-2021 @polkadot/react-signer authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, {useEffect, useState} from 'react';
import styled from 'styled-components';
import {ThemeProps} from "@polkadot/extension-koni-ui/types";
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import Password from "@polkadot/extension-koni-ui/Popup/Sending/parts/Password";
import Toggle from "@polkadot/extension-koni-ui/components/Toggle";


const UNLOCK_MINS = 15;

interface Props extends ThemeProps {
  address: string;
  className?: string;
  error?: string;
  onChange: (password: string, isUnlockCached: boolean) => void;
  onEnter?: () => void;
  password: string;
  tabIndex?: number;
}

function Unlock ({ address, className, error, onChange, onEnter, tabIndex }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [isUnlockCached, setIsUnlockCached] = useState(false);

  useEffect((): void => {
    onChange(password, isUnlockCached);
  }, [onChange, isUnlockCached, password]);

  return (
    <div className={className}>
      <Password
        autoFocus
        isError={!!error}
        label={t<string>('unlock account with password')}
        onChange={setPassword}
        onEnter={onEnter}
        tabIndex={tabIndex}
        value={password}
      >
      </Password>

      <div className={'kn-toggle-wrapper'}>
        <Toggle
          isOverlay
          label={t<string>('Unlock for {{expiry}} min', { replace: { expiry: UNLOCK_MINS } })}
          onChange={setIsUnlockCached}
          value={isUnlockCached}
        />
      </div>
    </div>
  );
}

export default React.memo(styled(Unlock)(({theme}: Props) => `
  .kn-toggle-wrapper {
      display: flex;
      margin-top: 10px;
      display: none;
      justify-content: flex-end;
  }
`));
