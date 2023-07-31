import React, { useEffect, useRef, useState } from 'react';
import { Transition } from 'react-transition-group';
import styled from 'styled-components';

import Message, { MessageType } from './Message';

type Props = {
  className?: string;
  in: boolean;
  messageType: MessageType;
  text: string;
  duration?: number;
};

const AnimatedMessage = ({ className = '', duration = 500, in: show, messageType, text }: Props) => {
  const nodeRef = useRef(null);
  const [currentText, setCurrentText] = useState<string>();

  useEffect(() => {
    if (text === currentText) {
      return;
    }

    if (!currentText) {
      setCurrentText(text);
    }

    setTimeout(setCurrentText, 150, text);
  }, [setCurrentText, currentText, text]);

  const expandedStyles = { opacity: 1, gridTemplateRows: '1fr' };
  const collapsedStyles = { opacity: 0, gridTemplateRows: '0fr', marginBlock: 0 };

  const transitionStyles = {
    entering: expandedStyles,
    entered: expandedStyles,
    exiting: collapsedStyles,
    exited: collapsedStyles,
    unmounted: collapsedStyles
  };

  return (
    <Transition
      appear
      in={show && text === currentText}
      mountOnEnter
      nodeRef={nodeRef}
      timeout={duration}
      unmountOnExit
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

const Wrapper = styled.div<{ $duration: number }>`
  display: grid;
  overflow: hidden;
  transition: ${({ $duration }) => `grid-template-rows ${$duration}ms, opacity ${$duration}ms, margin ${$duration}ms`}
`;

const StyledMessage = styled(Message)`
  min-height: 0;
`;

export default AnimatedMessage;
