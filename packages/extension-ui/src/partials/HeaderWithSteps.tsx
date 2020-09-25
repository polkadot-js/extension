// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '../types';

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import { ActionContext, ActionText } from '../components';
import Header from './Header';

interface Props extends ThemeProps {
  className?: string;
  onCancel?: () => void;
  step: number;
  text: string;
}

function HeaderWithSteps ({ className, onCancel, step, text }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);

  const _onCancel = useCallback(() => {
    onCancel
      ? onCancel()
      : onAction('/');
  }, [onAction, onCancel]);

  return (
    <Header
      className={className}
      text={text}
    >
      <div className='steps'>
        <div>
          <span className='current'>{step}</span>
          <span className='total'>/2</span>
        </div>
        <ActionText
          onClick={_onCancel}
          text='Cancel'
        />
      </div>
    </Header>
  );
}

export default React.memo(styled(HeaderWithSteps)(({ theme }: Props) => `
  .current {
    font-size: ${theme.labelFontSize};
    line-height: ${theme.labelLineHeight};
    color: ${theme.primaryColor};
    font-weight: 600;
  }

  .steps {
    align-items: center;
    display: flex;
    justify-content: space-between;
    flex-grow: 1;
    padding-left: 1em;
    padding-right: 24px;
    margin-top: 3px;
  }

  .total {
    font-size: ${theme.labelFontSize};
    line-height: ${theme.labelLineHeight};
    color: ${theme.textColor};
    font-weight: 600;
  }
`));
