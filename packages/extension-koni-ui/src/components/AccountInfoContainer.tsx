// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../types';

import React, {  useRef, useState } from 'react';
import styled from 'styled-components';

import AccountInfo from '@polkadot/extension-koni-ui/components/AccountInfo';
import useOutsideClick from '../hooks/useOutsideClick';

export interface Props {
  actions?: React.ReactNode;
  address?: string | null;
  children?: React.ReactNode;
  className?: string;
  genesisHash?: string | null;
  isHidden?: boolean;
  name?: string | null;
  parentName?: string | null;
  suri?: string;
  toggleActions?: number;
  type?: KeypairType;
}

function AccountInfoContainer ({ address, children, className, genesisHash, name, parentName, suri, type }: Props): React.ReactElement<Props> {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useOutsideClick(actionsRef, () => (showActionsMenu && setShowActionsMenu(!showActionsMenu)));

  return (
    <div
      className={className}
    >
      <AccountInfo
        address={address}
        genesisHash={genesisHash}
        name={name}
        parentName={parentName}
        suri={suri}
        type={type}
      />
      {children}
    </div>
  );
}

export default styled(AccountInfoContainer)(({ theme }: ThemeProps) => `
  box-sizing: border-box;
  position: relative;
  border: 2px solid ${theme.boxBorderColor};
  box-sizing: border-box;
  border-radius: 8px;
  padding: 0 15px 8px 15px;
`);
