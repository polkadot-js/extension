// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { AppContentButton } from '@subwallet/extension-koni-ui/types/staticContent';
import { Button } from '@subwallet/react-ui';
import React, { useCallback } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  buttons: AppContentButton[];
  onClickButton?: (url?: string, hasInstruction?: boolean) => void;
}

const Component = ({ buttons, className, onClickButton }: Props) => {
  const onClickItem = useCallback((button: AppContentButton) => {
    return () => {
      onClickButton && onClickButton(button.action?.url, !!button.instruction);
    };
  }, [onClickButton]);

  const getButtonSchema = useCallback((type: 'danger' | 'primary' | 'secondary' | 'warning') => {
    switch (type) {
      case 'secondary':
        return 'secondary';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'danger';
      case 'primary':
      default:
        return 'primary';
    }
  }, []);

  const renderItem = useCallback(
    (button: AppContentButton) => {
      return (
        <Button
          block
          key={button.id}
          onClick={onClickItem(button)}
          schema={button.color !== 'ghost' ? getButtonSchema(button.color) : 'primary'}
          type={button.color === 'ghost' ? 'ghost' : undefined}
        >
          {button.label}
        </Button>
      );
    },
    [getButtonSchema, onClickItem]
  );

  return (
    <div className={className}>
      {buttons.map((btn) => renderItem(btn))}
    </div>
  );
};

const OnlineButtonGroups = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    display: 'flex',
    alignItems: 'center'
  });
});

export default OnlineButtonGroups;
