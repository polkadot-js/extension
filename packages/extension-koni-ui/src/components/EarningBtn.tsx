import React, { useMemo } from 'react';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import styled from 'styled-components';
import { Button } from '@subwallet/react-ui';
import { SizeType } from '@subwallet/react-ui/es/config-provider/SizeContext';

interface Props extends ThemeProps {
  icon?: React.ReactNode,
  size?: SizeType,
  children?: React.ReactNode,
}

const Component = ({ className, icon, size = 'xs', children }: Props) => {
  const _borderRadius = useMemo(() => {
    if (size === 'xs') {
      return '20px';
    } else if (size === 'sm') {
      return '24px';
    } else if (size === 'md') {
      return '26px';
    }

    return '32px';
  }, [])

  return (
    <Button block={false} style={{ borderRadius: _borderRadius }} className={className} icon={icon} size={size} type={'ghost'} shape={'round'}>{children}</Button>
  );
};

const EarningBtn = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    width: 'fit-content',
    border: `2px solid ${token.colorBgBorder}`,
    '&:hover': {
      backgroundColor: token.colorBgSecondary,
      border: `2px solid ${token.colorBgSecondary}`,
    }
  }
});

export default EarningBtn;
