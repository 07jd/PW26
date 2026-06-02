import { Button, Card, Form, InputNumber, message, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { getNewTokenIfExpired } from "../../util";
import dayjs from "dayjs";

interface tableData {
  id: string;
  temperature: number;
  luminosity: number;
  humidity: number;
  time: string;
}

export function Consulta() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [msg, context] = message.useMessage();
  const [data, setData] = useState<tableData[]>([]);

  const deleteMetric = async (id: string) => {
    try {
      const response = await fetch(`/metrics/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        return;
      }

      const code = response.status;
      console.log(code);
      if (code === 404 || code === 400) {
        msg.open({
          type: "error",
          content: "Métrica inválida, faça refresh na página",
        });
        return;
      }

      throw new Error();
    } catch (e) {
      console.log(e);
      msg.open({
        type: "error",
        content: "Não foi possível apagar a métrica",
      });
    }
    console.log("a deletar");
    console.log(id);
  };

  const getData = async () => {
    const lote: number = form.getFieldValue("lote");

    try {
      setLoading(true);
      await getNewTokenIfExpired();

      const response = await fetch(`/metrics/${lote}`);
      if (!response.ok) {
        if (response.status === 404) {
          setData([]);
          setLoading(false);
          msg.open({
            type: "error",
            content: "Lote não existe",
          });

          return;
        }
        throw new Error();
      }

      const data = await response.json();
      console.log(data);
      setData(data);
      setLoading(false);
      msg.open({
        type: "success",
        content: "Dados obtidos",
      });
    } catch (e) {
      console.log(e);
      setLoading(false);
      setData([]);
      msg.open({
        type: "error",
        content: "Não foi possível obter dados",
      });
    }
  };

  const coluna_entries: ColumnsType<tableData> = [
    {
      title: "Temperatura",
      dataIndex: "temperature",
      key: "temperature",
    },
    {
      title: "Humidade",
      dataIndex: "humidity",
      key: "humidity",
    },
    {
      title: "Luminosidade",
      dataIndex: "luminosity",
      key: "luminosity",
    },
    {
      title: "Tempo de Captura",
      dataIndex: "time",
      key: "time",
      render: (value: string) => dayjs(value).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Apagar",
      key: "details",
      align: "center",
      render: (record: tableData) => (
        <Button
          type="primary"
          danger
          onClick={() => {
            deleteMetric(record.id);
            getData();
          }}
        >
          X
        </Button>
      ),
    },
  ];

  return (
    <>
      {context}
      <Card style={{ minWidth: "60%" }}>
        <Form form={form}>
          <Form.Item
            label="Lote"
            name={"lote"}
            required
            rules={[
              {
                required: true,
                message: "Forneça o número do lote",
              },
            ]}
          >
            <InputNumber min={0} onChange={() => getData()}></InputNumber>
          </Form.Item>
        </Form>
        <Table
          loading={loading}
          columns={coluna_entries}
          dataSource={data}
          pagination={{
            pageSize: 8,
          }}
        />
      </Card>
    </>
  );
}
