// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useRef, useState } from 'react';
import { Transition } from 'react-transition-group';
import styled from 'styled-components';

import Message, { MessageType } from './Message';

type Props = {
  className?: string;
  in: boolean;
  messageType: MessageType;
  text: string;
  duration: number;
};

const TransitionMessage = ({className = '', duration, in: show, messageType, text}: Props) => {
  const nodeRef = useRef(null);
  const [currentText, setCurrentText] = useState<string>();

  useEffect(() => {
    if (text === currentText) {
      return;
    }

    const timeout = currentText ? 150 : 0;

    setTimeout(setCurrentText, timeout, text);
  }, [setCurrentText, currentText, text]);

  const expandedStyles = { opacity: 1, gridTemplateRows: '1fr', paddingBottom: '8px' };
  const collapsedStyles = { opacity: 0, gridTemplateRows: '0fr' };

  const transitionStyles = {
    entering: expandedStyles,
    entered:  expandedStyles,
    exiting:  collapsedStyles,
    exited:  collapsedStyles,
    unmounted: collapsedStyles,
  };

  return (
    <Transition
      appear
      in={show && text === currentText}
      nodeRef={nodeRef}
      timeout={duration}
    >
      {(state) => (
          <Wrapper
            $duration={duration}
            ref={nodeRef}
            style={transitionStyles[state]}
          >
            <StyledMessage
              className={className}
              messageType={messageType}
            >
                {currentText}
            </StyledMessage>
          </Wrapper>
        )}
    </Transition>
  );
};

const Wrapper = styled.div<{$duration: number}>`
  display: grid;
  overflow: hidden;
  transition: ${({ $duration }) => `grid-template-rows ${$duration}ms, opacity ${$duration}ms, padding ${$duration}ms`}
`;

const StyledMessage = styled(Message)`
  min-height: 0;
`;


export default TransitionMessage;