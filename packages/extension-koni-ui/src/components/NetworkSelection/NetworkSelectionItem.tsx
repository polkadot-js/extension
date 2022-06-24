// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { HorizontalLabelToggle } from '@subwallet/extension-koni-ui/components';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  networkKey: string;
  networkJson: NetworkJson;
  handleSelect: (val: string, active: boolean) => void;
  logo: string;
  isSelected: boolean;
}

function NetworkSelectionItem ({ className, handleSelect, isSelected, logo, networkJson, networkKey }: Props): React.ReactElement {
  const [active, setActive] = useState(isSelected);
  const { show } = useToast();

  const toggleActive = useCallback((val: boolean) => {
    if (networkKey === 'polkadot' || networkKey === 'kusama') {
      show('This network is active by default');

      return;
    }

    if (!val) {
      setActive(false);
      handleSelect(networkKey, false);
    } else {
      setActive(true);
      handleSelect(networkKey, true);
    }
  }, [handleSelect, networkKey, show]);

  const handleClickOnRow = useCallback(() => {
    toggleActive(!active);
  }, [active, toggleActive]);

  return (
    <div className={`${className || ''}`}>
      <div
        className={'network-selection-item-wrapper'}
        onClick={handleClickOnRow}
      >
        <div className={'network-selection-item-container'}>
          <img
            alt='logo'
            className={'network-selection-logo'}
            src={logo}
          />

          <div className={'network-selection-chain'}>{networkJson.chain}</div>
        </div>

        <HorizontalLabelToggle
          checkedLabel={''}
          className={'network-selection-toggle'}
          toggleFunc={toggleActive}
          uncheckedLabel={''}
          value={active}
        />
      </div>
    </div>
  );
}

export default styled(NetworkSelectionItem)(({ theme }: Props) => `
  .network-selection-item-wrapper {
    width: 100%;
    display: flex;
    justify-content: space-between;
    color: ${theme.textColor2};
    cursor: pointer;
  }

  .network-selection-chain {
    font-weight: 500;
    font-size: 15px;
    line-height: 40px;
  }

  .network-selection-item-wrapper:hover {
    color: ${theme.textColor};
  }

  .network-selection-logo {
    display: block;
    min-width: 32px;
    height: 32px;
    border-radius: 100%;
    overflow: hidden;
    background-color: #fff;
    border: 1px solid #fff;
  }

  .network-selection-item-container {
    display: flex;
    gap: 10px;
    align-items: center;
    cursor: pointer;
  }
`);
