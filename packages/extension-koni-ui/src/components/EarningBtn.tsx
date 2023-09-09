// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button } from '@subwallet/react-ui';
import { SizeType } from '@subwallet/react-ui/es/config-provider/SizeContext';
import React, { useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  icon?: React.ReactNode,
  size?: SizeType,
  children?: React.ReactNode,
}

const Component = ({ children, className, icon, size = 'xs' }: Props) => {
  const _borderRadius = useMemo(() => {
    if (size === 'xs') {
      return '20px';
    } else if (size === 'sm') {
      return '24px';
    } else if (size === 'md') {
      return '26px';
    }

    return '32px';
  }, [size]);

  return (
    <Button
      block={false}
      className={className}
      icon={icon}
      shape={'round'}
      size={size}
      style={{ borderRadius: _borderRadius }}
      type={'ghost'}
    >{children}</Button>
  );
};

const EarningBtn = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    width: 'fit-content',
    border: `2px solid ${token.colorBgBorder}`,
    '&:hover': {
      backgroundColor: token.colorBgSecondary,
      border: `2px solid ${token.colorBgSecondary}`
    }
  };
});

export default EarningBtn;
