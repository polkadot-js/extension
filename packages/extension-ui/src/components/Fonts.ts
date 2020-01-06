// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { createGlobalStyle } from 'styled-components';
import NunitosansregularWoff2 from '../assets/fonts/Nunitosansregular.woff2';
import NunitosansregularWoff from '../assets/fonts/Nunitosansregular.woff';
import NunitosanssemiboldWoff2 from '../assets/fonts/Nunitosanssemibold.woff2';
import NunitosanssemiboldWoff from '../assets/fonts/Nunitosanssemibold.woff';
import NunitosanslightWoff2 from '../assets/fonts/Nunitosanslight.woff2';
import NunitosanslightWoff from '../assets/fonts/Nunitosanslight.woff';

export default createGlobalStyle`
  @font-face {
       font-family: 'Nunito';
       src: url(${NunitosanslightWoff2}) format('woff2'),
        url(${NunitosanslightWoff}) format('woff');
       font-weight: 400;
       font-style: normal;
  }
  @font-face {
       font-family: 'Nunito';
       src: url(${NunitosansregularWoff2}) format('woff2'),
        url(${NunitosansregularWoff}) format('woff');
       font-weight: 600;
       font-style: normal;
  }
  @font-face {
       font-family: 'Nunito';
       src: url(${NunitosanssemiboldWoff2}) format('woff2'),
        url(${NunitosanssemiboldWoff}) format('woff');
       font-weight: 800;
       font-style: normal;
  }
`;
