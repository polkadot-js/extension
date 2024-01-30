// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

interface Props {
  width?: number | string;
  height?: number | string;
}

const ImageSlash: React.FC<Props> = ({ height = 24, width = 24 }: Props) => {
  return (
    <svg
      fill='none'
      height={height}
      viewBox='0 0 24 24'
      width={width}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M21.1913 21.0725L20.4113 20.2925L18.0013 17.8825L13.4113 13.2925L3.59127 3.47249L2.81127 2.69249C2.42127 2.30249 1.79127 2.30249 1.40127 2.69249C1.00127 3.08249 1.00127 3.71249 1.39127 4.10249L3.00127 5.71249V18.8825C3.00127 19.9825 3.90127 20.8825 5.00127 20.8825H18.1713L19.7813 22.4925C20.1713 22.8825 20.8013 22.8825 21.1913 22.4925C21.5813 22.1025 21.5813 21.4625 21.1913 21.0725ZM6.02127 17.8825C5.60127 17.8825 5.37127 17.4025 5.63127 17.0725L8.12127 13.8725C8.32127 13.6225 8.70127 13.6125 8.90127 13.8625L11.0013 16.3925L12.1713 14.8825L15.1713 17.8825H6.02127ZM21.0013 18.0525L5.83127 2.88249H19.0013C20.1013 2.88249 21.0013 3.78249 21.0013 4.88249V18.0525Z'
        fill='currentColor'
      />
    </svg>
  );
};

export default ImageSlash;
