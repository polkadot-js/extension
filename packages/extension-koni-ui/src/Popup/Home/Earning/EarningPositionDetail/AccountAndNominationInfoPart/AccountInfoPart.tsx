// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { YieldPoolInfo, YieldPositionInfo } from '@subwallet/extension-base/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  compound: YieldPositionInfo;
  list: YieldPositionInfo[];
  inputAsset: _ChainAsset;
  poolInfo: YieldPoolInfo;
};

function Component ({ className }: Props) {
  return (
    <div
      className={CN(className)}
    >
    </div>
  );
}

export const AccountInfoPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({

}));
