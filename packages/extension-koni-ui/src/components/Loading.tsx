// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import {AssetImageMap} from "@polkadot/extension-koni-ui/assets";

interface Props extends ThemeProps {
  className?: 'string';
}

function Loading({ className }: Props): React.ReactElement<Props> {
  return (
    <div className={`${className} loading-layer`}><img src={AssetImageMap.loading} alt="Loading"/></div>
  );
}

export default React.memo(styled(Loading)(({ theme }: Props) => `
`));
