// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainInfoWithState } from '@subwallet/extension-koni-ui/hooks/chain/useChainInfoWithState';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { updateChainActiveState } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, Switch } from '@subwallet/react-ui';
import { PencilSimpleLine } from 'phosphor-react';
import React, { useCallback, useState } from 'react';
import { NavigateFunction } from 'react-router-dom';
import styled from 'styled-components';

interface Props extends ThemeProps {
  chainInfo: ChainInfoWithState,
  showDetailNavigation?: boolean,
  navigate?: NavigateFunction
}

function Component ({ chainInfo, className = '', navigate, showDetailNavigation }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const showNotification = useNotification();
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSwitchChainState = useCallback((checked: boolean, _event: React.MouseEvent<HTMLButtonElement>) => {
    if (!loading) {
      setLoading(true);
      updateChainActiveState(chainInfo.slug, checked)
        .then((result) => {
          setLoading(false);

          if (!result) {
            showNotification({
              message: t('Error'),
              type: 'error'
            });
          }
        })
        .catch(() => {
          showNotification({
            message: t('Error'),
            type: 'error'
          });
          setLoading(false);
        });
    }
  }, [chainInfo.slug, loading, showNotification, t]);

  const onClick = useCallback(() => {
    navigate && navigate('/settings/chains/detail', { state: chainInfo.slug });
  }, [chainInfo, navigate]);

  return (
    <div className={`${className}`}>
      <Switch
        checked={chainInfo.active}
        loading={loading}
        onClick={onSwitchChainState}
      />
      {
        showDetailNavigation && (
          <Button
            icon={(
              <Icon
                phosphorIcon={PencilSimpleLine}
                size='sm'
                type='phosphor'
              />
            )}
            onClick={onClick}
            size={'xs'}
            type={'ghost'}
          />
        )
      }
    </div>
  );
}

const ChainItemFooter = styled(Component)<Props>(() => {
  return ({
    display: 'flex',
    alignItems: 'center'
  });
});

export default ChainItemFooter;
