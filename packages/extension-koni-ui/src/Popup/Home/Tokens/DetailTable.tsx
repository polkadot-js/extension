// [object Object]
// SPDX-License-Identifier: Apache-2.0

import type { ColumnsType } from '@subwallet/react-ui/es/table';

import { Table } from '@subwallet/react-ui';

type Props<T> = {
  className?: string
  columns: ColumnsType<T>
  dataSource: T[]
  onClick?: (item: T) => void
}

const Component = <T extends object>({ columns,
  dataSource,
  onClick }: Props<T & { slug: string}>): React.ReactElement<Props<T & { slug: string}>> => {
  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      onRow={(record, rowIndex) => {
        return {
          onClick: () => {
            onClick && onClick(record);
          }
        };
      }}
      pagination={false}
      rowKey={(record) => record.slug}
    />
  );
};

export default Component;
