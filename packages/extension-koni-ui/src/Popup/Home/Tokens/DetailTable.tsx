import { Table } from "@subwallet/react-ui";
import type { ColumnsType } from '@subwallet/react-ui/es/table';

type Props<T> = {
  className?: string
  columns: ColumnsType<T>
  dataSource: T[]
  onClick?: (item: T) => void
}

const Component = <T extends object>({
  columns,
  dataSource,
  onClick
}: Props<T & { slug: string}>): React.ReactElement<Props<T & { slug: string}>> => {
  return (
    <Table
      rowKey={(record) => record.slug}
      dataSource={dataSource}
      columns={columns}
      pagination={false}
      onRow={(record, rowIndex) => {
        return {
          onClick: () => {
            onClick && onClick(record)
          },
        };
      }}
    />
  )
}

export default Component;
