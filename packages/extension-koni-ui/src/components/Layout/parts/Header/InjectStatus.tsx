// Copyright 2019-2022 @subwallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { InjectContext } from '@subwallet/extension-koni-ui/contexts/InjectContext';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon } from '@subwallet/react-ui';
import { Wallet } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

const Component: React.FC<ThemeProps> = ({ className }: ThemeProps) => {
  const { t } = useTranslation();
  const { disableInject, enableInject, enabled, injected } = useContext(InjectContext);

  const onClick = useCallback(() => {
    if (enabled) {
      disableInject();
    } else {
      enableInject();
    }
  }, [disableInject, enableInject, enabled]);

  return (<div className={className}>
    <Button
      disabled={!injected}
      icon={(
        <Icon
          phosphorIcon={Wallet}
          size='sm'
        />
      )}
      onClick={onClick}
      schema={'secondary'}
      shape={'circle'}
      size={'xs'}
      tooltip={t('Inject')}
    />
  </div>);
};

const InjectStatus = styled(Component)<ThemeProps>(({ theme: { token } }: ThemeProps) => {
  return {};
});

export default InjectStatus;
