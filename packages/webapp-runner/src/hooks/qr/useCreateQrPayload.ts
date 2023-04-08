// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createFrames } from "@subwallet-webapp/util/account/qr";
import { useEffect, useMemo, useRef, useState } from "react";

import { qrcode } from "@polkadot/react-qr/qrcode";
import { objectSpread } from "@polkadot/util";
import { xxhashAsHex } from "@polkadot/util-crypto";

const FRAME_DELAY = 1000;
const TIMER_INC = 100;

const getDataUrl = (value: Uint8Array): string => {
  const qr = qrcode(0, "M"); // HACK See our qrcode stringToBytes override as used internally. This
  // will only work for the case where we actually pass `Bytes` in here

  qr.addData(value as unknown as string, "Byte");
  qr.make();

  return qr.createDataURL(16, 0);
};

interface FrameState {
  index: number;
  frames: Uint8Array[];
  images: string[];
  valueHash: null | string;
}

const useCreateQrPayload = (
  value: Uint8Array,
  skipEncoding?: boolean
): { images: string[]; index: number } => {
  const [{ images, index }, setFrameState] = useState<FrameState>({
    index: 0,
    frames: [],
    images: [],
    valueHash: null,
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
      const _images = frames.map((frame) => getDataUrl(frame));

      return {
        index: 0,
        frames,
        images: _images,
        valueHash,
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
            index: frameIdx,
          });
        });
      })
        .then((value) => {
          if (value) {
            timeOutRef.current = setTimeout(nextFrame, timeDelayRef.current);
          }
        })
        .catch(console.log);
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

  return useMemo(
    () => ({
      images: images,
      index: index,
    }),
    [images, index]
  );
};

export default useCreateQrPayload;
