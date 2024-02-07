// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Icon, SwIconProps } from '@subwallet/react-ui';
import { X } from 'phosphor-react';
import React from 'react';

type Props = Omit<SwIconProps, 'type' | 'phosphorIcon' | 'fontawesomeIcon' | 'antDesignIcon'>

const CloseIcon: React.FC<Props> = (props: Props) => {
  return (
    <Icon
      phosphorIcon={X}
      size='md'
      {...props}
    />
  );
};

export default CloseIcon;
