// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { IconTheme } from '@polkadot/react-identicon/types';


import React from 'react';
import styled from 'styled-components';

import Icon from '@polkadot/react-identicon';
import {ThemeProps} from "@polkadot/extension-koni-ui/types";
import {getLogoByGenesisHash} from "@polkadot/extension-koni-ui/util/logoByGenesisHashMap";

interface Props {
  className?: string;
  iconTheme?: IconTheme;
  isExternal?: boolean | null;
  onCopy?: () => void;
  prefix?: number;
  value?: string | null;
  size?: number;
  showLogo?: boolean;
  genesisHash?: string;
}

function Identicon ({ className, iconTheme, onCopy, prefix, value, size, showLogo, genesisHash }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <Icon
        className='icon'
        onCopy={onCopy}
        prefix={prefix}
        size={size}
        theme={iconTheme}
        value={value}
      />
      {showLogo && genesisHash && (
        <img src={getLogoByGenesisHash(genesisHash)} alt="logo" className={'identity-icon__logo'} />
      )}
    </div>
  );
}

export default styled(Identicon)(({ theme }: ThemeProps) => `
  background: ${theme.backgroundAccountAddress};
  border-radius: 50%;
  display: flex;
  justify-content: center;
  padding: 2px;
  position: relative;

  .container:before {
    box-shadow: none;
    background: ${theme.identiconBackground};
  }

  .identity-icon__logo {
    width: 40%;
    height: 40%;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    margin: auto;
    border: 2px solid #fff;
    border-radius: 50%;
    position: absolute;
    background-color: #fff;
  }

  .icon {
    cursor: pointer;
  }

  svg {
    circle:first-of-type {
      display: none;
    }
  }
`);
