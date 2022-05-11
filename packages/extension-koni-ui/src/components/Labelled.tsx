// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { ThemeProps } from '@subwallet/extension-koni-ui/types';

import LabelHelp from './LabelHelp';

interface Props extends ThemeProps {
  className?: string;
  help?: React.ReactNode;
  isHidden?: boolean;
  isFull?: boolean;
  isOuter?: boolean;
  isSmall?: boolean;
  label?: React.ReactNode;
  labelExtra?: React.ReactNode;
  children: React.ReactNode;
  withEllipsis?: boolean;
  withLabel?: boolean;
}

const defaultLabel: React.ReactNode = <div>&nbsp;</div>;

function Labelled ({ className = '', children, help, isFull, isHidden, isOuter, isSmall, label = defaultLabel, labelExtra, withEllipsis, withLabel = true }: Props): React.ReactElement<Props> | null {
  if (isHidden) {
    return null;
  } else if (!withLabel) {
    return (
      <div className={className}>{children}</div>
    );
  }

  return (
    <div className={`ui--labelled${isSmall ? ' isSmall' : ''}${isFull ? ' isFull' : ''}${isOuter ? ' isOuter' : ''} ${className}`}>
      <label>{withEllipsis
        ? <div className='with-ellipsis'>{label}</div>
        : label
      }{help && <LabelHelp help={help} />}</label>
      {labelExtra && <div className='labelExtra'>{labelExtra}</div>}
      <div className='ui--labelled-content'>
        {children}
      </div>
    </div>
  );
}

export default React.memo(styled(Labelled)(({ theme }: Props) => `
  .with-ellipsis {
    display: inline;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 400;
  }
`));
