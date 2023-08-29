// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomizeModalSetting } from '@subwallet/extension-koni-ui/components/Modal/Customize/CustomizeModalSetting';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, Popover } from '@subwallet/react-ui';
import { FadersHorizontal } from 'phosphor-react';
import React, { forwardRef, LegacyRef } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const PopoverWrapper = styled.div<ThemeProps>(({ theme: { token } }: ThemeProps) => ({
  paddingLeft: token.padding,
  paddingRight: token.padding
}));

const Component: React.FC = () => {
  const { t } = useTranslation();

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
        tooltip={t('Toggle zero balance')}
        type={'ghost'}
      />
    </div>
  ));

  return (
    <Popover
      content={<PopoverWrapper><CustomizeModalSetting /></PopoverWrapper>}
      overlayInnerStyle={{
        padding: '16px 0'
      }}
      placement='bottomRight'
      showArrow={false}
      trigger='click'
    >
      <TriggerComponent />
    </Popover>
  );
};

const Customization = styled(Component)<ThemeProps>(() => {
  return {
  };
});

export default Customization;
