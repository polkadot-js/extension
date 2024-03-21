// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import CN from 'classnames';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  quoteAliveUntilValue: number | undefined;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, quoteAliveUntilValue } = props;
  const [quoteCountdownTime, setQuoteCountdownTime] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timer;

    if (quoteAliveUntilValue) {
      const updateQuoteCountdownTime = () => {
        const dateNow = Date.now();

        if (dateNow > quoteAliveUntilValue) {
          setQuoteCountdownTime(0);
          clearInterval(timer);
        } else {
          setQuoteCountdownTime(Math.round((quoteAliveUntilValue - dateNow) / 1000));
        }
      };

      timer = setInterval(updateQuoteCountdownTime, 1000);

      updateQuoteCountdownTime();
    } else {
      setQuoteCountdownTime(0);
    }

    return () => {
      clearInterval(timer);
    };
  }, [quoteAliveUntilValue, setQuoteCountdownTime]);

  return (
    <div className={CN(className, '__quote-reset-time')}>
      Quote reset in: <span className={CN({ '__quote-reset-change-color': quoteCountdownTime <= 10 })}>&nbsp;{quoteCountdownTime}s</span>
    </div>
  );
};

const QuoteResetTime = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__quote-reset-change-color': {
      color: token.colorError
    }
  };
});

export default QuoteResetTime;
