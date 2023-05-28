// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { ThemeProps } from '../types';
import { getFaviconUrl } from '../util/getFaviconUrl';

interface Props extends ThemeProps {
  className?: string;
  url: string;
  disconnectElement?: React.ReactNode;
  withoutProtocol?: boolean;
}

const FaviconBox: React.FC<Props> = function ({ className, disconnectElement, url, withoutProtocol }: Props) {
  const [favicon, setFavicon] = useState<string>('');

  const origin = new URL(decodeURIComponent(url)).origin;
  const strippedUrl = origin.replace(/^https?:\/\//, '');

  useEffect(() => {
    async function fetchFavicon() {
      const url = await getFaviconUrl(origin);

      setFavicon(url);
    }

    fetchFavicon().catch(console.error);
  }, [origin]);

  return (
    <div className={className}>
      <div className='favicon-box-content'>
        <img
          className='icon'
          src={favicon}
        />
        <span>{withoutProtocol ? strippedUrl : origin}</span>
      </div>
      <div className='disconnect-element'>{disconnectElement}</div>
    </div>
  );
};

export default styled(FaviconBox)(
  ({ theme }: ThemeProps) => `
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16px;
  gap: 8px;
  margin: 0px 16px;    
  background: ${theme.inputBorderColor};
  border-radius: 8px;
  transition: 0.2s ease;
  justify-content: space-evenly;
  
  .favicon-box-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;

    min-width: 0; /* To enable ellipsis for flex grandchildren (https://css-tricks.com/flexbox-truncated-text/) */
  }

  .disconnect-element {
    display: flex;
  }

  :hover {
    background: ${theme.editCardBackgroundHover};
    
    .disconnect-element{
       .remove-text {
        color: ${theme.buttonBackgroundDangerHover};
      }
      .remove-icon {
        background: ${theme.buttonBackgroundDangerHover};
      }
    }
  }

  font-family: ${theme.secondaryFontFamily};
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 120%;
  letter-spacing: 0.07em;

  .icon {
    width: 20px;
    height: 20px;
  }

  span {
    overflow: hidden;
    box-sizing: border-box;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`
);
