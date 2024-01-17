// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

interface Props {
  width?: number | string;
  height?: number | string;
}

const Logo3D: React.FC<Props> = ({ height = 120, width = 80 }: Props) => {
  return (
    <svg
      fill='none'
      height={height}
      viewBox='0 0 80 120'
      width={width}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M79.1209 43.5991V28.9749L14.0994 0L0 6.21868V57.4715L48.8003 79.1344L22.518 90.6834V79.1344L11.4301 74.1458L0 79.1344V113.986L13.4834 120L79.1209 90.7517V68.8155L21.7651 43.3257V30.0683L65.7059 49.6128L79.1209 43.5991Z'
        fill='white'
      />
    </svg>
  );
};

export default Logo3D;
