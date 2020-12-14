// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React from 'react';
import styled from 'styled-components';

import { AuthUrlInfo } from '@polkadot/extension-base/background/handlers/State';

import useTranslation from '../../hooks/useTranslation';

interface Props extends ThemeProps {
  className?: string;
  info: AuthUrlInfo;
  url: string;
}

function WebsiteEntry ({ className, info, url }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (

    <div className={className}>
      <div className='url'>{url}</div>
      <div className='info'>{info.isAllowed ? t<string>('allowed') : t<string>('stopped')}</div>
    </div>
  );
}

export default styled(WebsiteEntry)`
  .bla{

  }
`;
