// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolType } from '@subwallet/extension-base/types';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { EarningTagType, ThemeProps } from '@subwallet/extension-web-ui/types';
import { convertHexColorToRGBA, createEarningTypeTags } from '@subwallet/extension-web-ui/utils';
import { Icon, Tag } from '@subwallet/react-ui';
import CN from 'classnames';
import { Medal, MegaphoneSimple } from 'phosphor-react';
import React, { useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  type?: YieldPoolType;
  comingSoon?: boolean
  chain: string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { chain, className, comingSoon, type } = props;

  const { t } = useTranslation();

  const earningTagTypes: Record<YieldPoolType, EarningTagType> = useMemo(() => {
    return createEarningTypeTags(chain);
  }, [chain]);

  // todo: About label, will convert to key for i18n later
  const earningTag = useMemo((): EarningTagType =>
    type
      ? earningTagTypes[type]
      : comingSoon
        ? ({
          color: 'default',
          label: 'Coming soon',
          icon: MegaphoneSimple,
          weight: 'fill'
        })
        : ({
          color: 'lime',
          label: 'Exclusive rewards',
          icon: Medal,
          weight: 'fill'
        })
  , [comingSoon, earningTagTypes, type]);

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
      {t(earningTag.label)}
    </Tag>
  );
};

const EarningTypeTag = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '&.ant-tag-default': {
      backgroundColor: convertHexColorToRGBA(token['gray-6'], 0.1)
    }
  };
});

export default EarningTypeTag;
