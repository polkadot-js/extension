// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, SwSubHeader } from '@subwallet/react-ui';
import CN from 'classnames';
import { CaretRight, X } from 'phosphor-react';
import React, { useContext } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  index: number,
  numberOfConfirmations: number,
  onClickPrev: () => void,
  onClickNext: () => void,
  title?: string,
}

function Component ({ className, index, numberOfConfirmations, onClickNext, onClickPrev, title }: Props) {
  const { isWebUI } = useContext(ScreenContext);

  if (isWebUI) {
    return (
      <SwSubHeader
        background='transparent'
        center={true}
        className={CN(className, 'confirmation-header')}
        onBack={onClickPrev}
        paddingVertical={true}
        rightButtons={
          [{
            className: CN('__right-block'),
            // onClick: onClickNext,
            size: 'xs',
            icon: (
              <Icon
                phosphorIcon={X}
                size='md'
              />
            )
          }
          ]
        }
        showBackButton={true}
        title={title}
      />
    );
  }

  return (
    <SwSubHeader
      background='transparent'
      center={true}
      className={CN(className, 'confirmation-header')}
      onBack={onClickPrev}
      paddingVertical={true}
      rightButtons={(index === (numberOfConfirmations - 1) || numberOfConfirmations === 1)
        ? undefined
        : [
          {
            className: CN('__right-block'),
            onClick: onClickNext,
            size: 'xs',
            icon: (
              <Icon
                phosphorIcon={CaretRight}
                size='md'
              />
            )
          }
        ]}
      showBackButton={index > 0}
      title={title}
    />
  );
}

const ConfirmationHeader = styled(Component)<Props>(({ theme }: ThemeProps) => {
  return {};
});

export default ConfirmationHeader;
