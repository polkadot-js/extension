// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from 'react';

import Label from '@subwallet/extension-koni-ui/components/Label';
import { TextArea } from '@subwallet/extension-koni-ui/components/TextInputs';

interface Props {
  className?: string;
  isError?: boolean;
  isFocused?: boolean;
  isReadOnly?: boolean;
  rowsCount?: number;
  label: string;
  onChange?: (value: string) => void;
  value?: string;
  showWarningIcon?: boolean
  tooltipContent?: string
}

export default function KoniTextAreaWithLabel ({ className, isError, isFocused, isReadOnly, label, onChange, rowsCount, showWarningIcon, tooltipContent, value }: Props): React.ReactElement<Props> {
  const _onChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLTextAreaElement>): void => {
      onChange && onChange(value);
    },
    [onChange]
  );

  return (
    <Label
      className={className}
      label={label}
      showWarningIcon={showWarningIcon}
      tooltipContent={tooltipContent}
    >
      <TextArea
        autoCapitalize='off'
        autoCorrect='off'
        autoFocus={isFocused}
        onChange={_onChange}
        readOnly={isReadOnly}
        rows={rowsCount || 2}
        spellCheck={false}
        value={value}
        withError={isError}
      />
    </Label>
  );
}
