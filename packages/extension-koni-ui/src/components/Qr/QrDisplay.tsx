// Copyright 2017-2022 @polkadot/react-qr authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { qrcode } from '@polkadot/react-qr/qrcode';
import { createFrames, createImgSize } from '@polkadot/react-qr/util';
import { objectSpread } from '@polkadot/util';
import { xxhashAsHex } from '@polkadot/util-crypto';

interface Props extends ThemeProps{
  className?: string;
  size?: string | number;
  skipEncoding?: boolean;
  style?: React.CSSProperties;
  value: Uint8Array;
}

const FRAME_DELAY = 2500;
const TIMER_INC = 500;

function getDataUrl (value: Uint8Array): string {
  const qr = qrcode(0, 'M'); // HACK See our qrcode stringToBytes override as used internally. This
  // will only work for the case where we actually pass `Bytes` in here

  qr.addData(value as unknown as string, 'Byte');
  qr.make();

  return qr.createDataURL(16, 0);
}

const QrDisplay = ({ className,
  size,
  skipEncoding,
  style,
  value }: Props) => {
  const [{ image }, setFrameState] = useState<{frameIdx: number, frames: Uint8Array[], image: null | string, valueHash: null | string}>({
    frameIdx: 0,
    frames: [],
    image: null,
    valueHash: null
  });
  const timerRef = useRef<{timerDelay: number, timerId: null | NodeJS.Timeout | number}>({
    timerDelay: FRAME_DELAY,
    timerId: null
  });
  const containerStyle = useMemo(() => createImgSize(size), [size]); // run on initial load to setup the global timer and provide and unsubscribe

  useEffect(() => {
    const nextFrame = () => setFrameState((state) => {
      // when we have a single frame, we only ever fire once
      if (state.frames.length <= 1) {
        return state;
      }

      let frameIdx = state.frameIdx + 1; // when we overflow, skip to the first and slightly increase the delay between frames

      if (frameIdx === state.frames.length) {
        frameIdx = 0;
        timerRef.current.timerDelay = timerRef.current.timerDelay + TIMER_INC;
      }

      timerRef.current.timerId = setTimeout(nextFrame, timerRef.current.timerDelay); // only encode the frames on demand, not above as part of the
      // state derivation - in the case of large payloads, this should
      // be slightly more responsive on initial load

      return objectSpread({}, state, {
        frameIdx,
        image: getDataUrl(state.frames[frameIdx])
      });
    });

    timerRef.current.timerId = window.setTimeout(nextFrame, FRAME_DELAY);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      timerRef.current.timerId && clearTimeout(typeof timerRef.current.timerId === 'number' ? timerRef.current.timerId : timerRef.current.timerId[Symbol.toPrimitive]());
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setFrameState((state) => {
      const valueHash = xxhashAsHex(value);

      if (valueHash === state.valueHash) {
        return state;
      }

      const frames = skipEncoding ? [value] : createFrames(value); // encode on demand

      return {
        frameIdx: 0,
        frames,
        image: getDataUrl(frames[0]),
        valueHash
      };
    });
  }, [skipEncoding, value]);

  if (!image) {
    return null;
  }

  return (
    <div
      className={CN(className)}
      style={containerStyle}
    >
      <div
        className={'ui--qr-Display'}
        style={style}
      >
        <img
          alt='qr-code'
          src={image}
        />
      </div>
    </div>
  );
};

export default React.memo(styled(QrDisplay)(({ theme }: Props) => `
  .ui--qr-Display {
    height:100%;
    width:100%;

    img,svg {
      background:white;
      height:auto !important;
      max-height:100%;
      max-width:100%;
      width:auto !important;
    }
  }
`));
