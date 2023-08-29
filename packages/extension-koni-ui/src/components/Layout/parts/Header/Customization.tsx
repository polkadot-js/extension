// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BackgroundMask } from '@subwallet/extension-koni-ui/components/BackgroundMask';
import { CustomizeModalSetting } from '@subwallet/extension-koni-ui/components/Modal/Customize/CustomizeModalSetting';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, Popover } from '@subwallet/react-ui';
import { FadersHorizontal } from 'phosphor-react';
import React, { forwardRef, LegacyRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const PopoverWrapper = styled.div<ThemeProps>(({ theme: { token } }: ThemeProps) => ({
  paddingLeft: token.padding,
  paddingRight: token.padding
}));

const Component: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState<boolean>(false);

  // Remove ref error
  // eslint-disable-next-line react/display-name
  const TriggerComponent = forwardRef((props, ref) => (
    <div
      {...props}
      ref={ref as unknown as LegacyRef<HTMLDivElement> | undefined}
      style={{
        zIndex: 999
      }}
    >
      <Button
        icon={(
          <Icon
            phosphorIcon={FadersHorizontal}
            size={'sm'}
          />
        )}
        size={'xs'}
        tooltip={t('Customize asset display')}
        type={'ghost'}
      />
    </div>
  ));

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
  }, []);

  return (
    <>
      <Popover
        content={<PopoverWrapper><CustomizeModalSetting /></PopoverWrapper>}
        onOpenChange={handleOpenChange}
        open={open}
        overlayInnerStyle={{
          padding: '16px 0'
        }}
        placement='bottomRight'
        showArrow={false}
        trigger='click'
      >
        <TriggerComponent />
      </Popover>

      <BackgroundMask visible={open} />
    </>
  );
};

const Customization = styled(Component)<ThemeProps>(() => {
  return {
  };
});

export default Customization;
