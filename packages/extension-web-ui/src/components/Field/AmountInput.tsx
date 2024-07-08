// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { osName } from '@subwallet/extension-base/utils';
import { useForwardInputRef } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Input, InputRef } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import React, { ChangeEventHandler, ClipboardEventHandler, ForwardedRef, forwardRef, SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { BasicInputWrapper } from './Base';

interface Props extends ThemeProps, BasicInputWrapper {
  decimals: number;
  isButtonClicked?: boolean;
  maxValue: string;
  onSetMax?: (value: boolean) => void;
  showMaxButton?: boolean;
  forceUpdateMaxValue?: object;
  prefix?: React.ReactNode;
  defaultInvalidOutputValue?: string;
}

const isValidInput = (input: string) => {
  return !(isNaN(parseFloat(input)) || !input.match(/^-?\d*(\.\d+)?$/));
};

export const getInputValuesFromString = (input: string, power: number): string => {
  const intValue = input.split('.')[0];
  let valueBigN = new BigN(isValidInput(intValue) ? intValue : '0');

  valueBigN = valueBigN.div(new BigN(10).pow(power));

  return valueBigN.toFixed();
};

export const getOutputValuesFromString = (input: string, power: number, defaultInvalidOutputValue = ''): string => {
  if (!isValidInput(input)) {
    return defaultInvalidOutputValue;
  }

  let valueBigN = new BigN(input);

  valueBigN = valueBigN.times(new BigN(10).pow(power));

  return valueBigN.toFixed().split('.')[0];
};

const ctrlKey = 17;
const cmdLeftKey = 91;
const cmdRightKey = 93;
const cmdFirefoxKey = 224;

interface ControlData {
  [ctrlKey]: boolean;
  [cmdLeftKey]: boolean;
  [cmdRightKey]: boolean;
  [cmdFirefoxKey]: boolean;
}

const isMacOS = osName === 'macOS';

const isControlKey = (keycode: number) => {
  if (isMacOS) {
    return [cmdLeftKey, cmdRightKey, cmdFirefoxKey].includes(keycode);
  } else {
    return [ctrlKey].includes(keycode);
  }
};

const Component = (props: Props, ref: ForwardedRef<InputRef>) => {
  const { className, decimals, defaultInvalidOutputValue, disabled, forceUpdateMaxValue, isButtonClicked, maxValue, onChange, onSetMax, prefix, showMaxButton, statusHelp, tooltip, value } = props;

  const { t } = useTranslation();

  const inputRef = useForwardInputRef(ref);

  const [inputValue, setInputValue] = useState(value ? getInputValuesFromString(value, decimals) : value);
  const [firstTime, setFirstTime] = useState(true);
  const controlRef = useRef<ControlData>({
    [ctrlKey]: false,
    [cmdLeftKey]: false,
    [cmdRightKey]: false,
    [cmdFirefoxKey]: false
  });

  const _onClickMaxBtn = useCallback((e: SyntheticEvent) => {
    e.stopPropagation();
    inputRef.current?.focus();
    const transformVal = getInputValuesFromString(maxValue, decimals);

    setInputValue(transformVal);
    setFirstTime(false);
    onChange && onChange({ target: { value: maxValue } });
    onSetMax?.(true);
    inputRef.current?.blur();
  }, [onSetMax, inputRef, decimals, maxValue, onChange]);

  const getMaxLengthText = useCallback((value: string) => {
    return value.includes('.') ? decimals + 1 + value.split('.')[0].length : undefined;
  }, [decimals]);

  const suffix = useMemo((): React.ReactNode => (
    showMaxButton
      ? (
        <Button
          disabled={disabled}
          onClick={_onClickMaxBtn}
          size='xs'
          type='ghost'
        >
          <span className='max-btn-text'>{t('Max')}</span>
        </Button>
      )
      : (
        <span />
      )
  ), [disabled, showMaxButton, _onClickMaxBtn, t]);

  const onChangeInput: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    let value = event.target.value;
    const maxLength = getMaxLengthText(value);

    if (maxLength && value.length > maxLength) {
      value = value.slice(0, maxLength);
    }

    setInputValue(value);
    setFirstTime(false);

    const transformVal = getOutputValuesFromString(value, decimals, defaultInvalidOutputValue);

    onChange && onChange({ target: { value: transformVal } });
    onSetMax?.(false);
  }, [decimals, defaultInvalidOutputValue, getMaxLengthText, onChange, onSetMax]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<Element>): void => {
      const keycode = event.keyCode;

      if (isControlKey(keycode)) {
        controlRef.current = { ...controlRef.current, [keycode]: true };
      }

      if (event.key.length === 1) {
        const isUseControl = Object.values(controlRef.current).some((v) => v);

        const { selectionEnd: j, selectionStart: i, value } = event.target as HTMLInputElement;
        const newValue = `${value.substring(0, i || 0)}${event.key}${value.substring(j || 0)}`;

        if (!isUseControl) {
          if (!(/^(0|[1-9]\d*)(\.\d*)?$/).test(newValue)) {
            event.preventDefault();
          }
        }
      }
    },
    []
  );

  const onPaste = useCallback<ClipboardEventHandler<HTMLInputElement>>((event) => {
    const data = event.clipboardData.getData('text');

    const { selectionEnd: j, selectionStart: i, value } = event.currentTarget;
    const newValue = `${value.substring(0, i || 0)}${data}${value.substring(j || 0)}`;

    if (!(/^(0|[1-9]\d*)(\.\d*)?$/).test(newValue)) {
      event.preventDefault();
    }
  }, []);

  const onKeyUp = useCallback(
    (event: React.KeyboardEvent<Element>): void => {
      const keycode = event.keyCode;

      if (isControlKey(keycode)) {
        controlRef.current = { ...controlRef.current, [keycode]: false };
      }
    },
    []
  );

  useEffect(() => {
    let amount = true;

    if (inputValue && !firstTime) {
      const transformVal = getOutputValuesFromString(inputValue || '0', decimals, defaultInvalidOutputValue);

      setTimeout(() => {
        if (amount) {
          inputRef.current?.focus();
          onChange && onChange({ target: { value: transformVal } });
          inputRef.current?.blur();
        }
      }, 300);
    }

    return () => {
      amount = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decimals]);

  useEffect(() => {
    if (forceUpdateMaxValue) {
      const transformVal = getInputValuesFromString(maxValue, decimals);

      setInputValue(transformVal);
      onChange && onChange({ target: { value: maxValue } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decimals, forceUpdateMaxValue, maxValue]);

  useEffect(() => {
    if (isButtonClicked) {
      if (inputValue && inputValue.length > (getMaxLengthText(inputValue) || 0)) {
        let valueStr = inputValue.toString();
        const decimalPointIndex = valueStr.indexOf('.');

        if (decimalPointIndex !== -1) {
          valueStr = valueStr.slice(0, decimalPointIndex + decimals + 1);
          valueStr = valueStr.replace(/0+$/, '');

          if (valueStr.endsWith('.')) {
            valueStr = valueStr.slice(0, -1);
          }
        }

        setInputValue(valueStr);
      }
    }
  }, [decimals, getMaxLengthText, inputValue, isButtonClicked, value]);

  return (
    <Input
      className={className}
      disabled={disabled}
      id={props.id}
      label={props.label}
      onBlur={props.onBlur}
      onChange={onChangeInput}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onPaste={onPaste}
      // onCopy={onPaste}
      placeholder={props.placeholder || t('Amount')}
      prefix={prefix}
      readOnly={props.readOnly}
      ref={inputRef}
      statusHelp={statusHelp}
      suffix={suffix}
      tooltip={tooltip}
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
    },

    '.ant-btn': {
      '&:disabled, &.-disalbed': {
        '.max-btn-text': {
          color: token['colorSecondary-4']
        }
      }
    }
  };
});

export default AmountInput;
