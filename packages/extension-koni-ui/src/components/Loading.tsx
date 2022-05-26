// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AssetImageMap } from '@subwallet/extension-koni-ui/assets';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

function Loading ({ className = '' }: Props): React.ReactElement<Props> {
  return (
    <div className={`${className} loading-layer`}>
      <img
        alt='Loading'
        className={'loading-img'}
        src={AssetImageMap.loading}
      />
    </div>
  );
}

export default React.memo(styled(Loading)(({ theme }: Props) => ''));
