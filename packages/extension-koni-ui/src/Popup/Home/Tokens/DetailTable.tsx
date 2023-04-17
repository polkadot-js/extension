import { Table } from "@subwallet/react-ui";
import type { ColumnsType } from '@subwallet/react-ui/es/table';

type Props<T> = {
  className?: string
  columns: ColumnsType<T>
  dataSource: T[]
}

const Component = <T extends object>({
  columns,
  dataSource
}: Props<T>): React.ReactElement<Props<T>> => {
  console.log('dataSource', dataSource)
  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      pagination={false}
    />
  )
}

export default Component;
