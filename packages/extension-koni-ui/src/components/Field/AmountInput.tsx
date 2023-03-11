// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicInputWrapper } from '@subwallet/extension-koni-ui/components/Field/index';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Input, InputRef } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import React, { ChangeEventHandler, ForwardedRef, forwardRef, SyntheticEvent, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps, BasicInputWrapper {
  decimals: number;
  maxValue: string;
}

const isValidInput = (input: string) => {
  return !(isNaN(parseFloat(input)) || !input.match(/^-?\d*(\.\d+)?$/));
};

// @ts-ignore
export const getInputValuesFromString: (input: string, power: number) => string = (input: string, power: number) => {
  const intValue = input.split('.')[0];
  let valueBigN = new BigN(isValidInput(intValue) ? intValue : '0');

  valueBigN = valueBigN.div(new BigN(10).pow(power));

  return valueBigN.toFixed();
};

export const getOutputValuesFromString: (input: string, power: number) => string = (input: string, power: number) => {
  if (!isValidInput(input)) {
    return '';
  }

  let valueBigN = new BigN(input);

  valueBigN = valueBigN.times(new BigN(10).pow(power));

  return valueBigN.toFixed().split('.')[0];
};

const Component = (props: Props, ref: ForwardedRef<InputRef>) => {
  const { className, decimals, disabled, maxValue, onChange } = props;
  const [inputValue, setInputValue] = useState('');

  const { t } = useTranslation();

  const _onClickMaxBtn = useCallback((e: SyntheticEvent) => {
    e.stopPropagation();
    const transformVal = getOutputValuesFromString(maxValue, decimals);

    setInputValue(maxValue);
    onChange && onChange({ target: { value: transformVal } });
  }, [decimals, maxValue, onChange]);

  const getMaxLengthText = useCallback((value: string) => {
    return value.includes('.') ? decimals + 1 + value.split('.')[0].length : 10;
  }, [decimals]);

  const suffix = () => {
    return (
      <Button
        // eslint-disable-next-line react/jsx-no-bind
        onClick={_onClickMaxBtn}
        size='xs'
        type='ghost'
      >
        <span className='max-btn-text'>{t('Max')}</span>
      </Button>
    );
  };

  const onChangeInput: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    let value = event.target.value;
    const maxLength = getMaxLengthText(value);

    if (value.length > maxLength) {
      value = value.slice(0, maxLength);
    }

    setInputValue(value);

    const transformVal = getOutputValuesFromString(value, decimals);

    onChange && onChange({ target: { value: transformVal } });
  }, [decimals, getMaxLengthText, onChange]);

  return (
    <Input
      className={className}
      disabled={disabled}
      maxLength={5}
      onChange={onChangeInput}
      placeholder={t('Amount')}
      suffix={suffix()}
      type={'number'}
      value={inputValue}
    />
  );
};

const AmountInput = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return {
    '.ant-input-affix-wrapper, input': {
      overflow: 'hidden'
    },

    '.max-btn-text': {
      color: token.colorSuccess
    }
  };
});

export default AmountInput;
