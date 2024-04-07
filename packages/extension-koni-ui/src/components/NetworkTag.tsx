// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { EarningTagType, NetworkType, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { convertHexColorToRGBA } from '@subwallet/extension-koni-ui/utils';
import { Icon, Tag } from '@subwallet/react-ui';
import CN from 'classnames';
import { Moon, Sun } from 'phosphor-react';
import React, { useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  type: NetworkType;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, type } = props;

  const { t } = useTranslation();

  const networkTagTypes: Record<NetworkType, EarningTagType> = useMemo(() => {
    return {
      [NetworkType.MAIN_NETWORK]: {
        label: 'Mainnet',
        icon: Sun,
        color: 'green',
        weight: 'bold'
      },
      [NetworkType.TEST_NETWORK]: {
        label: 'Testnet',
        icon: Moon,
        color: 'yellow',
        weight: 'bold'
      }
    };
  }, []);

  // todo: About label, will convert to key for i18n later
  const netWorkTag = useMemo((): EarningTagType => {
    return networkTagTypes[type];
  }, [networkTagTypes, type]);

  return (
    <Tag
      bgType={'default'}
      className={CN(className)}
      color={netWorkTag.color}
      icon={(
        <Icon
          phosphorIcon={netWorkTag.icon}
          weight={netWorkTag.weight}
        />
      )}
    >
      {t(netWorkTag.label)}
    </Tag>
  );
};

const NetworkTag = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '&.ant-tag-default': {
      backgroundColor: convertHexColorToRGBA(token['gray-6'], 0.1)
    }
  };
});

export default NetworkTag;
