// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AlertBox, BaseModal } from '@subwallet/extension-web-ui/components';
import { FormCallbacks, ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Form, Icon, Input, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

enum SlippageValueType {
  INPUT_TYPE = 'input_value',
  SELECT_TYPE = 'select_value'
}

interface SlippageType {
  slippage: number,
  type?: SlippageValueType
}

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

  const { inactiveModal } = useContext(ModalContext);

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
      if (slippageValue.type === SlippageValueType.SELECT_TYPE) {
        for (const [key, val] of Object.entries(SLIPPAGE_TOLERANCE)) {
          if (val === slippageValue.slippage) {
            setSelectedSlippage(key);
            break;
          }
        }
      } else {
        form.setFieldValue('slippage', slippageValue.slippage);
      }

      firstRenderRef.current = true;
    }
  }, [form, slippageValue]);

  const handleApplySlippage = useCallback(() => {
    inactiveModal(modalId);
    const slippageValueForm = form.getFieldValue('slippage');

    console.log('slippageValueForm', slippageValueForm);
    console.log('selectedSlippage', selectedSlippage);

    if (selectedSlippage) {
      const slippageObject: SlippageType = {
        slippage: SLIPPAGE_TOLERANCE[selectedSlippage],
        type: SlippageValueType.SELECT_TYPE
      };

      onApplySlippage?.(slippageObject);
    } else if (slippageValueForm) {
      const slippageObject: SlippageType = {
        slippage: Number(slippageValueForm) / 100,
        type: SlippageValueType.INPUT_TYPE
      };

      onApplySlippage?.(slippageObject);
    }
  }, [form, inactiveModal, modalId, onApplySlippage, selectedSlippage]);

  const onValuesChange: FormCallbacks<FormProps>['onValuesChange'] = useCallback((changes: Partial<FormProps>, values: FormProps) => {
    const { slippage } = values;

    setSelectedSlippage(undefined);

    console.log('slippage_on_modal', slippage);
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
          <div>Or custom slippage</div>
          <div className={'__slippage-form'}>
            {/* <Input */}
            {/*  placeholder={'0.1 - 2'} */}
            {/* /> */}
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
      alignItems: 'center'
    }

  };
});

export default SlippageModal;
