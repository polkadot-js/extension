// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import InputWithLabel from '@subwallet/extension-koni-ui/components/InputWithLabel';
import ValidatedInput2 from '@subwallet/extension-koni-ui/components/ValidatedInput2';
import React, { useMemo } from 'react';

import useTranslation from '../hooks/useTranslation';
import { isNotShorterThan } from '../util/validators';

interface Props {
  className?: string;
  isFocused?: boolean;
  label?: string;
  onBlur?: (editedName: string) => void;
  onChange?: (name: string | null) => void;
  defaultValue?: string;
}

export default function HeaderEditName ({ className, defaultValue, isFocused, label, onBlur, onChange }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const isNameValid = useMemo(() => isNotShorterThan(3, t<string>('Account name is too short')), [t]);

  return (
    <ValidatedInput2
      className={className}
      component={InputWithLabel}
      data-input-name
      defaultValue={defaultValue}
      isFocused={isFocused}
      label={label || t<string>('A descriptive name for your account')}
      onBlur={onBlur}
      onEnter={onBlur}
      onValidatedChange={onChange}
      type='text'
      validator={isNameValid}
    />
  );
}
