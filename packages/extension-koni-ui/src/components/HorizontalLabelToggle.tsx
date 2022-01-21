// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';
import {ThemeProps} from "@polkadot/extension-koni-ui/types";
import Toggle from "@polkadot/extension-koni-ui/components/Toggle";

interface Props {
  className: string;
  toggleFunc: Function;
  value: any;
  uncheckedLabel: string;
  checkedLabel: string;
}

function HorizontalLabelToggle ({className, toggleFunc, value, uncheckedLabel, checkedLabel}: Props): React.ReactElement<Props> {

  return (
    <div className={className}>
      <span className={!value ? 'kn-label' : 'kn-label unselected-label'}>{uncheckedLabel}</span>
      <Toggle
        onChange={toggleFunc}
        className='horizontal-label-toggle'
        value={value}
      />
      <span className={!!value ? 'kn-label' : 'kn-label unselected-label'}>{checkedLabel}</span>
    </div>
  )
}

export default styled(HorizontalLabelToggle)(({ theme }: ThemeProps) =>`
  display: flex;
  align-items: center;
  .horizontal-label-toggle {
    margin: 0 14px;
  }

  .unselected-label {
    color: ${theme.textColor2}
  }
`);
