// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationRequestBase } from '@subwallet/extension-base/background/types';
import DualLogo from '@subwallet/extension-koni-ui/components/Logo/DualLogo';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Image, Logo, Typography } from '@subwallet/react-ui';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  request: ConfirmationRequestBase
}

// Get domain from full url
function getDomain (url: string): string {
  const domain = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

  return domain;
}

function Component ({ className, request }: Props) {
  const domain = getDomain(request.url);
  const leftLogoUrl = `https://icons.duckduckgo.com/ip2/${domain}.ico`;

  return (
    <div className={className}>
      <DualLogo
        leftLogo={<Image
          height={56}
          shape='squircle'
          src={leftLogoUrl}
          width={56}
        />}
        rightLogo={<Logo
          network={'subwallet'}
          shape='squircle'
          size={56}
        />}
      />
      <Typography.Paragraph className={'text-tertiary'}>
        {domain}
      </Typography.Paragraph>
    </div>
  );
}

const ConfirmationGeneralInfo = styled(Component)<Props>(({ theme }) => ({
  textAlign: 'center'
}));

export default ConfirmationGeneralInfo;
