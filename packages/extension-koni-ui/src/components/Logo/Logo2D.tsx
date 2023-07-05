// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

interface Props {
  width?: number | string;
  height?: number | string;
}

const Logo2D: React.FC<Props> = ({ height = 24, width = 16 }: Props) => {
  return (
    <svg
      fill='none'
      height={height}
      viewBox='0 0 16 24'
      width={width}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M15.8 8.71982V5.79499L2.81557 0L0 1.24374V11.4943L9.74516 15.8269L4.49671 18.1367V15.8269L2.28253 14.8292L0 15.8269V22.7973L2.69256 24L15.8 18.1503V13.7631L4.34637 8.66515V6.01367L13.1211 9.92255L15.8 8.71982Z'
        fill='currentColor'
      />
    </svg>
  );
};

export default Logo2D;
