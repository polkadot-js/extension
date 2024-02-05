// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// refer: https://blog.greenroots.info/how-to-create-a-countdown-timer-using-react-hooks

import { useEffect, useState } from 'react';

const useCountdown = (targetDate: number | string) => {
  const countDownDate = new Date(targetDate).getTime();

  const [countDown, setCountDown] = useState(countDownDate - new Date().getTime());

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = new Date().getTime();

      if (countDownDate <= currentTime) {
        setCountDown(0);
        clearInterval(interval);
      } else {
        setCountDown(countDownDate - currentTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [countDownDate]);

  return getReturnValues(countDown);
};

const getReturnValues = (countDown: number) => {
  if (!countDown || countDown < 0) {
    return [0, 0, 0, 0];
  }

  // calculate time left
  const days = Math.floor(countDown / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

  return [days, hours, minutes, seconds];
};

export { useCountdown };
