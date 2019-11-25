// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { createGlobalStyle } from 'styled-components';
import NunitoregularWoff2 from '../assets/fonts/Nunitoregular.woff2';
import NunitoregularWoff from '../assets/fonts/Nunitoregular.woff';
import NunitosemiboldWoff2 from '../assets/fonts/Nunitosemibold.woff2';
import NunitosemiboldWoff from '../assets/fonts/Nunitosemibold.woff';
import NunitolightWoff2 from '../assets/fonts/Nunitolight.woff2';
import NunitolightWoff from '../assets/fonts/Nunitolight.woff';

export default createGlobalStyle`
  @font-face {
       font-family: 'Nunito';
       src: url(${NunitolightWoff2}) format('woff2'),
        url(${NunitolightWoff}) format('woff');
       font-weight: 400;
       font-style: normal;
  }
  @font-face {
       font-family: 'Nunito';
       src: url(${NunitoregularWoff2}) format('woff2'),
        url(${NunitoregularWoff}) format('woff');
       font-weight: 600;
       font-style: normal;
  }
  @font-face {
       font-family: 'Nunito';
       src: url(${NunitosemiboldWoff2}) format('woff2'),
        url(${NunitosemiboldWoff}) format('woff');
       font-weight: 800;
       font-style: normal;
  }
`;
