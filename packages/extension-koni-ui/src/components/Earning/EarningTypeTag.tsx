// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolType } from '@subwallet/extension-base/background/KoniTypes';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { EarningTagType, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { createEarningTagTypes } from '@subwallet/extension-koni-ui/utils';
import { Icon, Tag } from '@subwallet/react-ui';
import CN from 'classnames';
import { Medal } from 'phosphor-react';
import React, { useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  type?: YieldPoolType;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, type } = props;

  const { t } = useTranslation();

  const earningTag = useMemo((): EarningTagType =>
    type
      ? createEarningTagTypes(t)[type]
      : (
        {
          color: 'lime',
          label: t('Exclusive rewards'),
          icon: Medal,
          weight: 'fill'
        }
      )
  , [t, type]);

  return (
    <Tag
      bgType={'default'}
      className={CN(className)}
      color={earningTag.color}
      icon={(
        <Icon
          phosphorIcon={earningTag.icon}
          weight={earningTag.weight}
        />
      )}
    >
      {earningTag.label}
    </Tag>
  );
};

const EarningTypeTag = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default EarningTypeTag;
