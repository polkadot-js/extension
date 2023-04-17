import { Button, Icon, Typography } from "@subwallet/react-ui"
import CN from "classnames"
import { FadersHorizontal } from "phosphor-react"
import { ThemeProps } from "@subwallet/extension-koni-ui/types"
import { MetaInfo } from "@subwallet/extension-koni-ui/components/MetaInfo"
export type Props = ThemeProps & {
  withController?: boolean,
  title?: string,
}

const mock = [
  {
    address: "string",
    name: "string",
  },
  {
    address: "string",
    name: "string",
  },
  {
    address: "string",
    name: "string",
  },
  {
    address: "string",
    name: "string",
  },
]

function Component({ title = 'Porfolio', className, withController = true }: Props): React.ReactElement<Props> {
  return (
    <div className={CN(className)}>
      <div className="common-header">
        <Typography.Title className="page-name">{title}</Typography.Title>
        {withController && <div className="action-group">
          <Button
            icon={<Icon phosphorIcon={FadersHorizontal} size={"sm"} />}
            size={"xs"}
            type={"ghost"}
          />
          <MetaInfo.AccountGroup
            className="ava-group"
            accounts={mock}
            content={`${mock.length} networks`}
            // label={t(data.type === StakingType.POOLED ? "Pool" : "Validators")}
          />
          <MetaInfo.AccountGroup
            className="ava-group"
            accounts={mock}
            content={`${mock.length} networks`}
            // label={t(data.type === StakingType.POOLED ? "Pool" : "Validators")}
          />
        </div>}
      </div>
    </div>
  )
}

export default Component
