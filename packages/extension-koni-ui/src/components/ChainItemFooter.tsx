// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { _ChainState } from '@subwallet/extension-base/services/chain-service/types';
import useNotification from '@subwallet/extension-koni-ui/hooks/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { updateChainActiveState } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Switch } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import { DotsThree } from 'phosphor-react';
import React, { useCallback, useState } from 'react';
import { NavigateFunction } from 'react-router';
import styled from 'styled-components';

interface Props extends ThemeProps {
  chainState: _ChainState,
  chainInfo: _ChainInfo,
  showDetailNavigation?: boolean,
  navigate?: NavigateFunction
}

function Component ({ chainInfo, chainState, className = '', navigate, showDetailNavigation }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const showNotification = useNotification();

  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(chainState.active);

  const onSwitchChainState = useCallback((checked: boolean, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!loading) {
      updateChainActiveState(chainInfo.slug, checked)
        .then((result) => {
          setLoading(false);

          if (result) {
            setChecked(checked);
          } else {
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
        checked={checked}
        disabled={loading}
        onClick={onSwitchChainState}
      />
      {
        showDetailNavigation && <Button
          icon={<Icon
            phosphorIcon={DotsThree}
            size='sm'
            type='phosphor'
          />}
          onClick={onClick}
          size={'xs'}
          type={'ghost'}
        />
      }
    </div>
  );
}

const ChainItemFooter = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    display: 'flex',
    alignItems: 'center'
  });
});

export default ChainItemFooter;
