// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import useUnlockChecker from '@subwallet/extension-koni-ui/hooks/common/useUnlockChecker';
import { keyringLock } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon } from '@subwallet/react-ui';
import { LockKey, LockKeyOpen } from 'phosphor-react';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

const Component: React.FC<ThemeProps> = ({ className }: ThemeProps) => {
  const { t } = useTranslation();
  const isLocked = useSelector((state: RootState) => state.accountState.isLocked);
  const unlockCheck = useUnlockChecker();

  const toggleLock = useCallback(() => {
    if (isLocked) {
      unlockCheck().catch(() => {
        // unlock is cancelled
      });
    } else {
      keyringLock().catch(console.log);
    }
  }, [isLocked, unlockCheck]);

  return (<div className={className}>
    <Button
      icon={<Icon
        phosphorIcon={isLocked ? LockKeyOpen : LockKey}
        size={'sm'}
      />}
      onClick={toggleLock}
      schema={'secondary'}
      shape={'circle'}
      size={'xs'}
      tooltip={isLocked ? t('Click to unlock') : t('Click to lock')}
    />
  </div>);
};

const Accounts = styled(Component)<ThemeProps>(({ theme: { token } }: ThemeProps) => {
  return {};
});

export default Accounts;
