import { message, Table, Tag } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import { useEffect, useState } from "react";
import { getNewTokenIfExpired } from "../../util";
import type { ColumnsType } from "antd/es/table";

interface tableData {
  user?: string;
  description?: string;
  system: boolean;
  createdAt: string;
}

async function getData(
  setData: React.Dispatch<React.SetStateAction<tableData[]>>,
  msg: MessageInstance,
) {
  try {
    await getNewTokenIfExpired();
    const response = await fetch("/logs");

    if (!response.ok) throw new Error();

    const raw = await response.json();
    setData(raw);
  } catch {
    msg.open({
      type: "error",
      content: "Erro ao obter os logs",
    });
  }
}

export function Logs() {
  const [msg, context] = message.useMessage();
  const [data, setData] = useState<tableData[]>([]);

  useEffect(() => {
    getData(setData, msg);
  }, [msg]);

  const columns: ColumnsType<tableData> = [
    {
      title: "Utilizador",
      dataIndex: "user",
      key: "user",
      render: (v: string) => v || "—",
    },
    {
      title: "Descrição",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Sistema",
      dataIndex: "system",
      key: "system",
      render: (value: boolean) =>
        value ? (
          <Tag color="blue">Sistema</Tag>
        ) : (
          <Tag color="green">Utilizador</Tag>
        ),
    },
    {
      title: "Data",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => new Date(value).toLocaleString("pt-PT"),
    },
  ];

  return (
    <>
      {context}
      <Table
        style={{ minWidth: "60%" }}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 8 }}
      />
    </>
  );
}
