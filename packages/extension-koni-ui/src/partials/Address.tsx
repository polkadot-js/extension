// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faQrcode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import InputWithLabel from '@subwallet/extension-koni-ui/components/InputWithLabel';
import ValidatedInput from '@subwallet/extension-koni-ui/components/ValidatedInput';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { readOnlyScan } from '@subwallet/extension-koni-ui/util/scanner/attach';
import { Result, Validator } from '@subwallet/extension-koni-ui/util/validators';
import React, { useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps{
  address?: string;
  className?: string;
  isFocused?: boolean;
  label?: string;
  onBlur?: () => void;
  onChange: (name: string | null) => void;
  value?: string | null;
  onClickQr?: () => void;
}

function validatorAddress (errorText: string): Validator<string> {
  return (value: string): Result<string> => {
    const result = readOnlyScan(value);

    return !result ? Result.error(errorText) : Result.ok(value);
  };
}

const Address = ({ className, isFocused, label, onBlur, onChange, onClickQr, value }: Props) => {
  const { t } = useTranslation();
  const isNameValid = useMemo(() => validatorAddress(t<string>('Invalid Address')), [t]);

  return (
    <div className={className}>
      <ValidatedInput
        className={className}
        component={InputWithLabel}
        data-input-name
        defaultValue={value}
        isFocused={isFocused}
        label={label || t<string>('Account Address')}
        onBlur={onBlur}
        onEnter={onBlur}
        onValidatedChange={onChange}
        type='text'
        validator={isNameValid}
      />
      <div
        className={'qr-icon'}
        onClick={onClickQr}
      >
        <FontAwesomeIcon icon={faQrcode} />
      </div>
    </div>
  );
};

export default React.memo(styled(Address)(({ theme }: Props) => `
  position: relative;

  .qr-icon {
    cursor: pointer;
    position: absolute;
    right: 5px;
    top: 0;
    color: ${theme.textColor2};
  }
`));
