// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createFrames } from '@subwallet/extension-web-ui/utils';
import { useEffect, useMemo, useRef, useState } from 'react';

import { objectSpread } from '@polkadot/util';
import { xxhashAsHex } from '@polkadot/util-crypto';

const FRAME_DELAY = 1000;
const TIMER_INC = 100;

const getDataString = (value: Uint8Array): string => {
  return Buffer.from(value).toString('binary');
};

interface FrameState {
  index: number;
  frames: Uint8Array[];
  data: string[];
  valueHash: null | string;
}

const useCreateQrPayload = (value: Uint8Array, skipEncoding?: boolean): { data: string[]; index: number } => {
  const [{ data, index }, setFrameState] = useState<FrameState>({
    index: 0,
    frames: [],
    data: [],
    valueHash: null
  });

  const timeOutRef = useRef<NodeJS.Timer>();
  const timeDelayRef = useRef<number>(FRAME_DELAY);

  useEffect(() => {
    setFrameState((state) => {
      const valueHash = xxhashAsHex(value);

      if (valueHash === state.valueHash) {
        return state;
      }

      const frames = skipEncoding ? [value] : createFrames(value); // encode on demand
      const _images = frames.map((frame) => getDataString(frame));

      return {
        index: 0,
        frames,
        data: _images,
        valueHash
      };
    });
  }, [skipEncoding, value]);

  useEffect(() => {
    let amount = true;

    const nextFrame = () => {
      if (!amount) {
        return;
      }

      new Promise<boolean>((resolve) => {
        setFrameState((state) => {
          // when we have a single frame, we only ever fire once
          if (state.frames.length <= 1) {
            resolve(false);

            return state;
          }

          let frameIdx = state.index + 1; // when we overflow, skip to the first and slightly increase the delay between frames

          if (frameIdx === state.frames.length) {
            frameIdx = 0;
            timeDelayRef.current = timeDelayRef.current + TIMER_INC;
          }

          resolve(true);

          // state derivation - in the case of large payloads, this should
          // be slightly more responsive on initial load

          return objectSpread({}, state, {
            index: frameIdx
          });
        });
      })
        .then((value) => {
          if (value) {
            timeOutRef.current = setTimeout(nextFrame, timeDelayRef.current);
          }
        })
        .catch(console.log)
      ;
    };

    timeOutRef.current = setTimeout(() => {
      if (amount) {
        nextFrame();
      }
    }, FRAME_DELAY);

    return () => {
      amount = false;

      const { current: id } = timeOutRef;

      clearTimeout(id);
    };
  }, []);

  return useMemo(() => ({
    data: data,
    index: index
  }), [data, index]);
};

export default useCreateQrPayload;
