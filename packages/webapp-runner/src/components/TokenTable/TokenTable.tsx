import Table from "rc-table"

const Component: React.FC = ({ columns, data }: Record<string, any>) => {
  return (
    <Table
      columns={columns}
      data={data}
      className="token-table"
      rowClassName="token-row"
    />
  )
}

export default Component
