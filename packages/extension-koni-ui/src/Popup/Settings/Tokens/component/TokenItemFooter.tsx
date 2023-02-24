// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { AssetSetting } from '@subwallet/extension-base/background/KoniTypes';
import useNotification from '@subwallet/extension-koni-ui/hooks/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { updateAssetSetting } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Switch } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import { DotsThree } from 'phosphor-react';
import React, { useCallback, useState } from 'react';
import { NavigateFunction } from 'react-router';
import styled from 'styled-components';

interface Props extends ThemeProps {
  assetSetting: AssetSetting | undefined,
  tokenInfo: _ChainAsset,
  navigate: NavigateFunction
}

function Component ({ assetSetting, className = '', navigate, tokenInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const showNotification = useNotification();

  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(assetSetting?.visible || false);

  const onSwitchTokenVisible = useCallback((checked: boolean, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!loading) {
      updateAssetSetting({
        tokenSlug: tokenInfo.slug,
        assetSetting: {
          visible: checked
        }
      })
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
  }, [loading, showNotification, t, tokenInfo.slug]);

  const onClick = useCallback(() => {
    navigate('/settings/tokens/detail', { state: tokenInfo });
  }, [navigate, tokenInfo]);

  return (
    <div className={`manage_tokens__right_item_container ${className}`}>
      <Switch
        checked={checked}
        disabled={loading}
        onClick={onSwitchTokenVisible}
      />
      <Button
        icon={<Icon
          phosphorIcon={DotsThree}
          size='sm'
          type='phosphor'
        />}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={onClick}
        size={'xs'}
        type={'ghost'}
      />
    </div>
  );
}

const TokenItemFooter = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({});
});

export default TokenItemFooter;
