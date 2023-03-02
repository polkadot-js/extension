// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from 'react';
import styled from 'styled-components';

import { ThemeProps } from '@polkadot/extension-ui/types';

interface VideoProps extends ThemeProps {
  source: string;
  onEnded: (state: boolean) => void;
  onStarted: (state: boolean) => void;
  type: string;
  className?: string;
}

function Video({ className, onEnded, onStarted, source, type }: VideoProps): React.ReactElement<VideoProps> {
  const handleEnd = useCallback(() => onEnded(false), [onEnded]);
  const handleStart = useCallback(() => onStarted(true), [onStarted]);

  return (
    <video
      autoPlay
      className={className}
      onEnded={handleEnd}
      onPlaying={handleStart}
    >
      <source
        src={source}
        type={type}
      />
    </video>
  );
}

export default React.memo(
  styled(Video)<VideoProps>(
    () => `
    padding: 0;
    width: 100%;
  `
  )
);
