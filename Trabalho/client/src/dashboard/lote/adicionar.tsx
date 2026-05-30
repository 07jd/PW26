import {
  Button,
  Card,
  DatePicker,
  Form,
  InputNumber,
  message,
  Select,
} from "antd";
import { useState } from "react";
import { getNewTokenIfExpired } from "../../util";

interface formPost {
  num: number;
  quantityPlanted: number;
  operationMode: string;
  start: string;
  state: string;
}

interface herbData {
  id: string;
  name: string;
  category: string;
}

export interface plansData {
  id: string;
  name: string;
}

const endpoint_herbs = "/herb/search";
const endpoint_plans = "/plan/search";
const endpoint = "/lote";

export function Adicionar() {
  const [form] = Form.useForm();
  const [msg, contextHolder] = message.useMessage();
  const [plansSearch, setPlansSearch] = useState<plansData[]>([]);
  const [herbsSearch, setHerbsSearch] = useState<herbData[]>([]);

  const getHerbs = async () => {
    try {
      await getNewTokenIfExpired();
      const response = await fetch(endpoint_herbs);
      if (response.ok) {
        const data = await response.json();
        setHerbsSearch(data);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const getPlans = async () => {
    try {
      await getNewTokenIfExpired();
      const response = await fetch(endpoint_plans);
      if (response.ok) {
        const data = await response.json();
        setPlansSearch(data);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const postPlan = async (data: formPost) => {
    try {
      await getNewTokenIfExpired();

      const request_body = {
        herb: form.getFieldValue("herb"),
        plans: form.getFieldValue("plans"),
        start: "",
      };

      Object.assign(request_body, data);
      request_body.start = String(data.start);
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request_body),
      });

      if (response.ok) {
        form.resetFields();
        msg.open({
          type: "success",
          content: "Lote criado com sucesso",
        });
        return;
      }

      const errors = (await response.json()).errors;
      for (const [key, val] of Object.entries(errors)) {
        if (key.includes("num")) {
          form.setFields([
            {
              name: "num",
              errors: [String(val)],
            },
          ]);
        }

        if (key.includes("herb")) {
          form.setFields([
            {
              name: "herb",
              errors: [String(val)],
            },
          ]);
        }

        if (key.includes("start")) {
          form.setFields([
            {
              name: "start",
              errors: [String(val)],
            },
          ]);
        }

        if (key.includes("quantityPlanted")) {
          form.setFields([
            {
              name: "quantityPlanted",
              errors: [String(val)],
            },
          ]);
        }

        if (key.includes("plans")) {
          form.setFields([
            {
              name: "plans",
              errors: [String(val)],
            },
          ]);
        }
      }
    } catch (e) {
      msg.open({
        type: "error",
        content: "Tente novamente mais tarde",
      });
      console.log(e);
    }
  };

  return (
    <>
      {contextHolder}
      <Card
        style={{
          minWidth: "60%",
        }}
      >
        <Form
          form={form}
          onFinish={postPlan}
          initialValues={{
            operationMode: "auto",
            state: "ativo",
          }}
        >
          <Form.Item<formPost>
            label="Número do lote"
            required
            name={"num"}
            rules={[
              {
                required: true,
                message: "Fornceçao o número do lote",
              },
            ]}
          >
            <InputNumber min={0}></InputNumber>
          </Form.Item>

          <Form.Item
            label="Erva"
            name={"herb"}
            required
            rules={[
              {
                required: true,
                message: "Forneça a erva associada ao lote",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              options={herbsSearch.map((e) => ({
                label: e.name,
                value: e.id,
              }))}
              onFocus={() => getHerbs()}
            ></Select>
          </Form.Item>

          <Form.Item
            label="Planos"
            name={"plans"}
            required
            rules={[
              {
                required: true,
                message: "Forneça os planos associados ao lote",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              mode="multiple"
              options={plansSearch.map((e) => ({
                label: e.name,
                value: e.id,
              }))}
              onFocus={() => getPlans()}
            ></Select>
          </Form.Item>

          <Form.Item<formPost>
            label="Quantidade plantada"
            required
            name={"quantityPlanted"}
            rules={[
              {
                required: true,
                message: "Forneça a quantidade plantada",
              },
            ]}
          >
            <InputNumber min={0}></InputNumber>
          </Form.Item>

          <Form.Item<formPost>
            label="Modo de operação"
            required
            name={"operationMode"}
          >
            <Select
              defaultValue={"auto"}
              defaultActiveFirstOption
              options={[
                {
                  label: "Automático",
                  value: "auto",
                },
                {
                  label: "Manual",
                  value: "manual",
                },
              ]}
            ></Select>
          </Form.Item>

          <Form.Item<formPost> label="Estado do lote" required name={"state"}>
            <Select
              defaultValue={"auto"}
              defaultActiveFirstOption
              options={[
                {
                  label: "Ativo",
                  value: "ativo",
                },
                {
                  label: "Comprometido",
                  value: "comprometido",
                },
              ]}
            ></Select>
          </Form.Item>

          <Form.Item<formPost>
            label="Início"
            required
            name={"start"}
            rules={[
              {
                required: true,
                message: "Forneça a data de início",
              },
            ]}
          >
            <DatePicker></DatePicker>
          </Form.Item>

          <Form.Item>
            <Button style={{ width: "100%" }} type="primary" htmlType="submit">
              Criar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
