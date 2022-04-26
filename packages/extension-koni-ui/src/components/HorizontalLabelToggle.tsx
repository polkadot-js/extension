// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import Toggle from '@polkadot/extension-koni-ui/components/Toggle';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props {
  className: string;
  toggleFunc: (isChecked: boolean) => void;
  value: boolean;
  uncheckedLabel: string;
  checkedLabel: string;
  isDisable?: boolean;
}

function HorizontalLabelToggle ({ checkedLabel, className, isDisable, toggleFunc, uncheckedLabel, value }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <span className={!value ? 'horizontal-label' : 'horizontal-label unselected-label'}>{uncheckedLabel}</span>
      <Toggle
        className='horizontal-label-toggle'
        isDisabled={isDisable}
        onChange={toggleFunc}
        value={value}
      />
      <span className={value ? 'horizontal-label' : 'horizontal-label unselected-label'}>{checkedLabel}</span>
    </div>
  );
}

export default styled(HorizontalLabelToggle)(({ theme }: ThemeProps) => `
  display: flex;
  align-items: center;
  .horizontal-label-toggle {
    margin: 0 14px;
  }

  .unselected-label {
    color: ${theme.textColor2}
  }
`);
