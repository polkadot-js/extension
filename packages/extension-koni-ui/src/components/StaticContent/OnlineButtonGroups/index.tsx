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
  const renderItem = useCallback(
    (button: AppContentButton) => {
      return (
        <Button
          block
          color={button.color}
          key={button.id}
          onClick={() => onClickButton && onClickButton(button.action?.url, !!button.instruction)}
        >
          {button.label}
        </Button>
      );
    },
    [onClickButton]
  );

  return (
    <div className={className}>
      {buttons.map((btn) => renderItem(btn))}
    </div>
  );
};

const OnlineButtonGroups = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    gap: token.sizeSM,
    marginTop: token.size
  });
});

export default OnlineButtonGroups;
