import {
  Button,
  Card,
  DatePicker,
  Flex,
  Form,
  InputNumber,
  message,
  Switch,
} from "antd";
import { useState } from "react";
import { getNewTokenIfExpired } from "../../util";

interface postData {
  temperature: number;
  humidity: number;
  luminosity: number;
}

export function Adicionar() {
  const [msg, context] = message.useMessage();
  const [form] = Form.useForm();
  const [customDate, setCustomDate] = useState(false);

  const criar = async (data: postData) => {
    const lote = form.getFieldValue("lote");

    let tempo = null;
    if (customDate) {
      const raw_tempo = form.getFieldValue("date");
      if (!raw_tempo) {
        form.setFields([
          {
            name: "date",
            errors: ["Forneça a data"],
          },
        ]);
        return;
      }
      tempo = raw_tempo.toISOString();
    }

    try {
      await getNewTokenIfExpired();
      const response = await fetch(`/metrics/${lote}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          time: tempo,
          ...data,
        }),
      });

      if (response.ok) {
        message.open({
          type: "success",
          content: "Métrica adicionada",
        });
        form.resetFields();
        setCustomDate(false);
        return;
      }

      if (response.status === 404) {
        form.setFields([
          {
            name: "lote",
            errors: ["Lote não existe"],
          },
        ]);
        return;
      }
      const errors = (await response.json()).errors;
      for (const [key, value] of Object.entries(errors)) {
        if (key.includes("time")) {
          form.setFields([
            {
              name: "date",
              errors: [String(value)],
            },
          ]);
        }

        if (key.includes("humidity")) {
          form.setFields([
            {
              name: "humidity",
              errors: [String(value)],
            },
          ]);
        }

        if (key.includes("lote")) {
          form.setFields([
            {
              name: "lote",
              errors: [String(value)],
            },
          ]);
        }

        if (key.includes("temperature")) {
          form.setFields([
            {
              name: "temperature",
              errors: [String(value)],
            },
          ]);
        }
      }
    } catch (e) {
      msg.open({
        type: "error",
        content: "Não foi possível adicionar a métrica",
      });
      console.log(e);
    }
  };

  return (
    <>
      {context}
      <Card style={{ minWidth: "60%" }}>
        <Form form={form} onFinish={criar}>
          <Form.Item
            label="Lote"
            required
            rules={[{ required: true, message: "Forneça do lote" }]}
            name={"lote"}
          >
            <InputNumber min={0}></InputNumber>
          </Form.Item>

          <Form.Item<postData>
            label="Temperatura"
            required
            rules={[{ required: true, message: "Forneça a temperatura" }]}
            name={"temperature"}
          >
            <InputNumber min={0}></InputNumber>
          </Form.Item>

          <Form.Item<postData>
            label="Humidade"
            required
            rules={[{ required: true, message: "Forneça a humidade" }]}
            name={"humidity"}
          >
            <InputNumber min={0} max={100}></InputNumber>
          </Form.Item>

          <Form.Item<postData>
            label="Luminosidade"
            required
            rules={[{ required: true, message: "Forneça a luminosidade" }]}
            name={"luminosity"}
          >
            <InputNumber min={0}></InputNumber>
          </Form.Item>

          <Flex gap={22}>
            <Form.Item label="Usar tempo customizado">
              <Switch checked={customDate} onChange={setCustomDate} />
            </Form.Item>

            <Form.Item label="Tempo de registro" name={"date"}>
              <DatePicker showTime allowClear disabled={!customDate} />
            </Form.Item>
          </Flex>
          <Form.Item>
            <Button type="primary" style={{ width: "100%" }} htmlType="submit">
              Adicionar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
