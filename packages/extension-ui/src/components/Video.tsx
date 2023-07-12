// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { ThemeProps } from '@polkadot/extension-ui/types';

interface VideoProps extends ThemeProps {
  source: string;
  onEnded: () => void;
  onStarted: () => void;
  type: string;
  className?: string;
}

function Video({ className, onEnded, onStarted, source, type }: VideoProps): React.ReactElement<VideoProps> {
  return (
    <video
      autoPlay
      className={className}
      onEnded={onEnded}
      onPlaying={onStarted}
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
