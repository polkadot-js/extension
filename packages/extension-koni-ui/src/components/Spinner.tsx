// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';
import React from 'react';
import styled from 'styled-components';

import {AssetImageMap} from "@polkadot/extension-koni-ui/assets";

interface Props extends ThemeProps {
  className?: string;
  size?: 'normal';
}

function Spinner ({ className = '', size = 'normal' }: Props): React.ReactElement<Props> {
  return (
    <img
      className={`${className} ${size}Size`}
      src={AssetImageMap.loading}
    />
  );
}

export default React.memo(styled(Spinner)`
  height: 32px;
  width: 32px;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  margin: auto;
  position: absolute;
  z-index: 100;
`);
