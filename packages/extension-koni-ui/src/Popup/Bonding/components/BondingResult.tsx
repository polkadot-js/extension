// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Modal from '@subwallet/extension-koni-ui/components/Modal';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

function BondingResult ({ className }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <Modal>
        blah blah bloh
      </Modal>
    </div>
  );
}

export default React.memo(styled(BondingResult)(({ theme }: Props) => `

`));
