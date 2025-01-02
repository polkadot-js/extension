// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext } from 'react';

import { ActionContext, ActionText } from '../components/index.js';
import { styled } from '../styled.js';
import Header from './Header.js';

interface Props {
  className?: string;
  step: number;
  text: string;
}

function HeaderWithSteps ({ className, step, text }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);

  const _onCancel = useCallback(() => {
    onAction('/');
  }, [onAction]);

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

export default React.memo(styled(HeaderWithSteps)<Props>`
  .current {
    font-size: var(--labelFontSize);
    line-height: var(--labelLineHeight);
    color: var(--primaryColor);
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
    font-size: var(--labelFontSize);
    line-height: var(--labelLineHeight);
    color: var(--textColor);
  }
`);
