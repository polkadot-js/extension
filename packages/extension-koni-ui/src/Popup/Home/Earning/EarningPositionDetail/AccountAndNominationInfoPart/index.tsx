// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps;

function Component ({ className }: Props) {
  return (
    <div
      className={CN(className)}
    >
    </div>
  );
}

export const AccountAndNominationInfoPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({

}));
