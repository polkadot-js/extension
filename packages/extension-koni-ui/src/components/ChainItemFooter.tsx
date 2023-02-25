// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { _ChainState } from '@subwallet/extension-base/services/chain-service/types';
import useNotification from '@subwallet/extension-koni-ui/hooks/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { changeChainActiveState } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Switch } from '@subwallet/react-ui';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  chainState: _ChainState,
  chainInfo: _ChainInfo
}

function Component ({ chainInfo, chainState, className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const showNotification = useNotification();

  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(chainState.active);

  const onSwitchChainState = useCallback((checked: boolean, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!loading) {
      changeChainActiveState(chainInfo.slug, checked)
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

  return (
    <div className={`${className}`}>
      <Switch
        checked={checked}
        disabled={loading}
        onClick={onSwitchChainState}
      />
    </div>
  );
}

const ChainItemFooter = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({});
});

export default ChainItemFooter;
