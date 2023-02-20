// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, SwHeader, Typography } from '@subwallet/react-ui';
import { ButtonProps } from '@subwallet/react-ui/es/button';
import CN from 'classnames';
import { CaretLeft, CaretRight } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  index: number,
  numberOfConfirmations: number,
  onClickPrev: () => void,
  onClickNext: () => void,
  title?: string,
}

function Component ({ className, index, numberOfConfirmations, onClickNext, onClickPrev, title }: Props) {
  const leftButton = (<Button
    className={CN('__left-block', { hidden: index === 0 })}
    disabled={index === 0}
    icon={<Icon
      phosphorIcon={CaretLeft}
      size='md'
    />}
    onClick={onClickPrev}
    size={'xs'}
    type={'text'}
  />);

  const rightButtons = ([{
    className: CN('__right-block', { hidden: index === (numberOfConfirmations - 1) }),
    disabled: index === (numberOfConfirmations - 1),
    onClick: onClickNext,
    size: 'xs',
    icon: (<Icon
      phosphorIcon={CaretRight}
      size='md'
    />),
    type: 'text'
  }] as ButtonProps[]);

  return (
    <SwHeader
      className={CN('confirmation-header', className)}
      left={leftButton}
      rightButtons={rightButtons}
      showLeftButton={true}
    >
      <Typography.Title
        className={'__middle-block'}
        level={4}
      >
        {title}
      </Typography.Title>
    </SwHeader>
  );
}

const ConfirmationHeader = styled(Component)<Props>(({ theme }) => ({
  display: 'flex',

  '.__middle-block': {
    flex: '1 1 auto',
    textAlign: 'center',
    alignSelf: 'center'
  }
}));

export default ConfirmationHeader;
