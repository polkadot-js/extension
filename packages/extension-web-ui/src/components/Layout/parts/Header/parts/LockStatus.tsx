// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import useUILock from '@subwallet/extension-web-ui/hooks/common/useUILock';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon } from '@subwallet/react-ui';
import { Lock } from 'phosphor-react';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

const Component: React.FC<ThemeProps> = ({ className }: ThemeProps) => {
  const { t } = useTranslation();
  const { lock } = useUILock();
  const [locking, setLocking] = useState(false);

  const onLock = useCallback(() => {
    setLocking(true);
    lock()
      .then(() => {
        // Do nothing
      })
      .catch(console.error)
      .finally(() => {
        setLocking(false);
      });
  }, [lock]);

  return (<div className={className}>
    <Button
      icon={<Icon
        phosphorIcon={Lock}
        size={'sm'}
      />}
      loading={locking}
      onClick={onLock}
      schema={'secondary'}
      shape={'circle'}
      size={'xs'}
      tooltip={t('Lock')}
    />
  </div>);
};

const Accounts = styled(Component)<ThemeProps>(({ theme: { token } }: ThemeProps) => {
  return {};
});

export default Accounts;
