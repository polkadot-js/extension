// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import removeIcon from '../assets/unlink.svg';
import useTranslation from '../hooks/useTranslation';
import { ActionContext } from './contexts';
import FaviconBox from './FaviconBox';
import Svg from './Svg';

interface Props {
  className?: string;
  url: string;
}

const StyledFaviconBox = styled(FaviconBox)`
  box-sizing: border-box;
  margin: 0px  -16px 0px  0px ;
  width: 328px;
`;

function RemoveAuth({ className, url }: Props): React.ReactElement {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const goToDisconnect = useCallback(() => {
    onAction(`/url/disconnect/${encodeURIComponent(url)}`);
  }, [onAction, url]);

  const disconnectElement = (
    <div
      className='remove-container'
      onClick={goToDisconnect}
    >
      <Svg
        className='remove-icon'
        src={removeIcon}
      />
      <span className='remove-text'>{t('Disconnect')}</span>
    </div>
  );

  return (
    <div className={className}>
      <StyledFaviconBox
        disconnectElement={disconnectElement}
        url={url}
      />
    </div>
  );
}

export default styled(RemoveAuth)(
  ({ theme }: ThemeProps) => `
  display: flex;

  .remove-container{
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    font-family: ${theme.secondaryFontFamily};
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 135%;
    letter-spacing: 0.06em;

    .remove-text {
      color: ${theme.dangerBackground};
    }

    :hover {
      .remove-text{
        color: ${theme.buttonBackgroundDangerHover};
      }
    
      .remove-icon {
        background: ${theme.buttonBackgroundDangerHover};
      }
    }
  }

  .remove-icon {
    cursor: pointer;
    height: 16px;
    width: 16px;
    background: ${theme.dangerBackground};
  }
`
);
