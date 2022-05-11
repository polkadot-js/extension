// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { IconName } from '@fortawesome/fontawesome-svg-core';

import React, { useState } from 'react';
import styled from 'styled-components';

import Tooltip from '@subwallet/extension-koni-ui/components/Tooltip';

import Icon from './Icon';

interface Props {
  help: React.ReactNode;
  icon?: IconName;
  className?: string;
}

let id = 0;

function LabelHelp ({ className = '', help, icon = 'question-circle' }: Props): React.ReactElement<Props> {
  const [trigger] = useState(() => `label-help-${++id}`);

  return (
    <div
      className={`ui--LabelHelp ${className}`}
      tabIndex={-1}
    >
      <Icon
        icon={icon}
        tooltip={trigger}
      />
      <Tooltip
        text={help}
        trigger={trigger}
      />
    </div>
  );
}

export default React.memo(styled(LabelHelp)`
  cursor: help;
  display: inline-block;
  line-height: 1rem;
  margin: 0 0 0 0.25rem;
  z-index: 10;
`);
