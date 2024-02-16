// Copyright 2019-2022 @subwallet/sub-connect authors & contributors
// SPDX-License-Identifier: Apache-2.0

import MobileDetect from 'mobile-detect';

const detect = navigator?.userAgent ? new MobileDetect(navigator.userAgent, 1200) : false;

export const isAndroid = detect && detect.os() === 'AndroidOS';
export const isIOS = detect && detect.os() === 'iOS';
export const isMobile = isIOS || isAndroid;
