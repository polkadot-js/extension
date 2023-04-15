import React from 'react';
import { ThemeProps } from "@subwallet/extension-koni-ui/types"
import styled from 'styled-components';
import { Layout } from '@subwallet/extension-koni-ui/components';

type Props = ThemeProps & {
  className?: string;
}

function Component({ className }: Props): React.ReactElement<Props> {
  return (
    <Layout.WithSideMenu
      title='Porfolio'
    >

    </Layout.WithSideMenu>
  )
}

const Porfolio = styled(Component)<Props>(() => {
  return {}
})

export default Porfolio
