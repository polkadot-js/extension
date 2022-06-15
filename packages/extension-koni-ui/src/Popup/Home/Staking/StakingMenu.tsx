// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Menu from '@subwallet/extension-koni-ui/components/Menu';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  reference: React.MutableRefObject<null>;
}

function StakingMenu ({ className, reference }: Props): React.ReactElement<Props> {
  return (
    <Menu
      className={className}
      reference={reference}
    >
      <div>gibberish</div>
    </Menu>
  );
}

export default React.memo(styled(StakingMenu)(({ theme }: Props) => `

`));
