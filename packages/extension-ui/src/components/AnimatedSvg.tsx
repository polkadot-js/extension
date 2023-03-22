// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

type Props = {
  src: string;
  className?: string;
};

const AnimatedSvg: React.FC<Props> = ({ className, src }) => {
  const key = Date.now();

  return (
    <img
      className={className}
      key={key}
      src={src}
    />
  );
};

export default AnimatedSvg;
