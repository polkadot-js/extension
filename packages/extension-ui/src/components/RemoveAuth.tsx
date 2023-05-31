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
  margin: 0px auto;
  max-width: calc(100% - 24px);
`;

function RemoveAuth({ className, url }: Props): React.ReactElement {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const goToDisconnect = useCallback(() => {
    onAction(`/url/disconnect/${encodeURIComponent(url)}`);
  }, [onAction, url]);

  const disconnectElement = (
    <button
      className='remove-container'
      onClick={goToDisconnect}
      type='button'
    >
      <Svg
        className='remove-icon'
        src={removeIcon}
      />
      <span className='remove-text'>{t('Disconnect')}</span>
    </button>
  );

  return (
    <div className={className}>
      <StyledFaviconBox
        disconnectElement={disconnectElement}
        url={url}
        withoutProtocol
      />
    </div>
  );
}

export default styled(RemoveAuth)(
  ({ theme }: ThemeProps) => `
  display: flex;

  .remove-container{
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    background: none;
    border: none;

    font-family: ${theme.secondaryFontFamily};
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 135%;
    letter-spacing: 0.06em;

    .remove-text {
      transition: 0.2 ease;
      color: ${theme.dangerBackground};
    }

    :hover, :focus {
      .remove-text{
        color: ${theme.buttonBackgroundDangerHover};
      }
    
      .remove-icon {
        background: ${theme.buttonBackgroundDangerHover};
      }
    }
  }

  .remove-icon {
    transition: 0.2 ease;
    cursor: pointer;
    height: 16px;
    width: 16px;
    background: ${theme.dangerBackground};
  }
`
);
