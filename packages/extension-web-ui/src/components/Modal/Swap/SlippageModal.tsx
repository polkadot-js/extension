// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SlippageType } from '@subwallet/extension-base/types/swap';
import { AlertBox, BaseModal } from '@subwallet/extension-web-ui/components';
import { FormCallbacks, ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Form, Icon, Input, ModalContext } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { CheckCircle, XCircle } from 'phosphor-react';
import React, { ClipboardEventHandler, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  modalId: string,
  onApplySlippage?: (slippage: SlippageType) => void,
  slippageValue: SlippageType
}
const SLIPPAGE_TOLERANCE: Record<string, number> = {
  option_1: 0.001,
  option_2: 0.005,
  option_3: 0.01,
  option_4: 0.03
};

interface FormProps {
  slippage: string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, modalId, onApplySlippage, slippageValue } = props;
  const [selectedSlippage, setSelectedSlippage] = useState<string | undefined>();
  const firstRenderRef = useRef(false);

  const { checkActive, inactiveModal } = useContext(ModalContext);
  const isActive = checkActive(modalId);

  const [form] = Form.useForm<FormProps>();

  const formDefault = useMemo((): FormProps => ({
    slippage: '0'
  }), []);

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal, modalId]);

  const handleSelectSlippage = useCallback((item: string) => {
    return () => {
      setSelectedSlippage(item);
    };
  }, []);

  useEffect(() => {
    if (selectedSlippage) {
      form.setFieldValue('slippage', undefined);
    }
  }, [form, selectedSlippage]);

  useEffect(() => {
    if (!firstRenderRef.current) {
      if (slippageValue.isCustomType) {
        for (const [key, val] of Object.entries(SLIPPAGE_TOLERANCE)) {
          if (slippageValue.slippage.isEqualTo(val)) {
            setSelectedSlippage(key);
            firstRenderRef.current = true;
            break;
          }
        }

        !firstRenderRef.current && setSelectedSlippage(undefined);
        form.setFieldValue('slippage', undefined);
      } else {
        form.setFieldValue('slippage', slippageValue.slippage.multipliedBy(100));
      }
    }
  }, [form, isActive, slippageValue.isCustomType, slippageValue.slippage]);

  useEffect(() => {
    if (!isActive) {
      firstRenderRef.current = false;
    }
  }, [isActive]);

  const handleApplySlippage = useCallback(() => {
    inactiveModal(modalId);
    const slippageValueForm = form.getFieldValue('slippage') as string;

    if (selectedSlippage) {
      const slippageObject: SlippageType = {
        slippage: new BigN(SLIPPAGE_TOLERANCE[selectedSlippage]),
        isCustomType: true
      };

      onApplySlippage?.(slippageObject);
    } else if (slippageValueForm) {
      const slippageObject: SlippageType = {
        slippage: new BigN(slippageValueForm).div(100),
        isCustomType: false
      };

      onApplySlippage?.(slippageObject);
    }
  }, [form, inactiveModal, modalId, onApplySlippage, selectedSlippage]);

  const onValuesChange: FormCallbacks<FormProps>['onValuesChange'] = useCallback((changes: Partial<FormProps>, values: FormProps) => {
    setSelectedSlippage(undefined);
  }, []);

  const onPaste = useCallback<ClipboardEventHandler<HTMLInputElement>>((event) => {
    const data = event.clipboardData.getData('text');

    const { selectionEnd: j, selectionStart: i, value } = event.currentTarget;
    const newValue = `${value.substring(0, i || 0)}${data}${value.substring(j || 0)}`;

    if (!(/^(0|[1-9]\d*)(\.\d*)?$/).test(newValue)) {
      event.preventDefault();
    }
  }, []);

  const onKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    const charCode = event.charCode;

    if ((charCode < 48 || charCode > 57) && charCode !== 46) {
      event.preventDefault();
    }

    const currentValue = event.currentTarget.value;
    const newValue = parseFloat(currentValue + String.fromCharCode(charCode));

    if (newValue < 0 || newValue > 100) {
      event.preventDefault();
    }
  }, []);

  return (
    <>
      <BaseModal
        className={CN(className, 'slippage-modal-container')}
        closable={true}
        destroyOnClose={true}
        footer={
          <>
            {(
              <Button
                block={true}
                className={'__left-button'}
                icon={(
                  <Icon
                    phosphorIcon={XCircle}
                    weight={'fill'}
                  />
                )}
                onClick={onCancel}
                schema={'secondary'}
              >
                {'Cancel'}
              </Button>
            )}
            <Button
              block={true}
              className={'__right-button'}
              icon={(
                <Icon
                  phosphorIcon={CheckCircle}
                  weight={'fill'}
                />
              )}
              onClick={handleApplySlippage}
            >
              {'Apply'}
            </Button>
          </>
        }
        id={modalId}
        onCancel={onCancel}
        title={'Slippage setting'}
      >
        <div className={'__item-slippage-tolerance'}>
          <div className={'__item-slippage-title'}>Select slippage tolerance</div>
          <div className={'__item-block-button'}>
            {Object.entries(SLIPPAGE_TOLERANCE).map(([key, value]) => (
              <div
                className={CN('-button', { selected: key === selectedSlippage })}
                key={key}
              >
                <Button
                  onClick={handleSelectSlippage(key)}
                  type='ghost'
                >
                  {value * 100}%
                </Button>
              </div>
            ))}
          </div>
          <div className={'__item-custom-slippage'}>Or custom slippage</div>
          <div className={'__slippage-form'}>
            <Form
              form={form}
              initialValues={formDefault}
              onValuesChange={onValuesChange}
            >
              <Form.Item
                name={'slippage'}
              >
                <Input
                  min={0}
                  onKeyPress={onKeyPress}
                  onPaste={onPaste}
                  placeholder={'0.1 - 2'}
                />
              </Form.Item>
            </Form>
            <span>%</span>
          </div>
        </div>
        <div>
          <AlertBox
            description={'Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Use with caution.'}
            title={'Pay attention!'}
            type={'warning'}
          />
        </div>
      </BaseModal>
    </>
  );
};

const SlippageModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '&.slippage-modal-container .ant-sw-modal-footer': {
      display: 'flex'
    },
    '.__item-slippage-tolerance': {
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: token.colorBgSecondary,
      padding: 12,
      borderRadius: 8,
      gap: 12,
      marginBottom: 12
    },
    '.selected.selected': {
      backgroundColor: token.colorPrimary
    },
    '.__item-block-button': {
      display: 'flex',
      gap: 8
    },
    '.-button': {
      display: 'flex',
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: token.colorBgInput,
      fontSize: 16,
      fontWeight: token.fontWeightStrong,
      lineHeight: token.lineHeightLG
    },
    '.__slippage-form': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: token.colorBgInput,
      borderRadius: 8,
      paddingRight: token.padding
    },
    '.__item-slippage-title, .__item-custom-slippage': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      fontWeight: token.bodyFontWeight,
      color: token.colorTextTertiary
    },
    '.ant-input-container': {
      backgroundColor: token.colorBgInput
    },
    '.ant-form-item': {
      marginBottom: 0
    },
    '.ant-btn-ghost': {
      color: token.colorWhite
    },
    '.ant-btn-ghost:hover': {
      color: token['gray-6']
    },
    '.ant-sw-modal-footer': {
      borderTop: 0
    }

  };
});

export default SlippageModal;
