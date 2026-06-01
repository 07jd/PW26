import {
  Button,
  Card,
  DatePicker,
  Form,
  InputNumber,
  message,
  Select,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import { useEffect, useState } from "react";
import { getNewTokenIfExpired } from "../../util";
import type { plansData } from "./adicionar";
import dayjs from "dayjs";

interface updateData {
  id: string;
  state: string;
  operationMode: string;
  end?: string;
  observations?: string;
  reasonLoss?: string;
  quantityLoss?: number;
  quantityHarvested?: number;
  plans: string[];
}

export function Atualizar() {
  const [form] = Form.useForm();
  const [msg, contextHolder] = message.useMessage();
  const [validLote, setValidLote] = useState(false);
  const [dataForm, setDataForm] = useState<updateData | undefined>();
  const [planSearch, setPlansSearch] = useState<plansData[]>([]);

  useEffect(() => {
    if (!dataForm) return;

    form.setFieldsValue({
      ...dataForm,
      end: dataForm.end ? dayjs(dataForm.end) : null,
    });
  }, [dataForm, form]);

  const getPlans = async () => {
    try {
      await getNewTokenIfExpired();
      const response = await fetch("/plan/search");

      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setPlansSearch(data);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const getLoteData = async () => {
    try {
      await getNewTokenIfExpired();
      const id = form.getFieldValue("lote");
      if (!id) {
        setValidLote(false);
        setPlansSearch([]);
        return;
      }

      const response = await fetch(`/lote/search?lote=${id}`);
      if (response.status == 404 || response.status == 400) {
        msg.open({
          type: "error",
          content: "Lote não existe",
        });

        return;
      }

      if (!response.ok) throw new Error();

      const data = await response.json();
      console.log(data);

      setDataForm(data);
      setValidLote(true);
    } catch (e) {
      console.log(e);
      setValidLote(false);
      setPlansSearch([]);
      msg.open({
        type: "error",
        content: "Tente novamente mais tarde",
      });
    }
  };

  const updateLote = async (data: updateData) => {
    try {
      await getNewTokenIfExpired();
      const id = form.getFieldValue("lote");
      if (!id) return;

      const response = await fetch(`/lote/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        message.open({
          type: "success",
          content: "Dados alterados",
        });

        setValidLote(false);
        form.resetFields();
        return;
      }

      const errors = (await response.json()).errors;
      if (!errors) throw new Error();

      console.log(errors);
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

        if (key.includes("end")) {
          form.setFields([
            {
              name: "end",
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
      message.open({
        type: "error",
        content: "Não foi possível atualzar os dados",
      });
      console.log(e);
    }
  };

  return (
    <>
      {contextHolder}
      <Card style={{ minWidth: "60%" }}>
        <Form form={form} onFinish={updateLote}>
          <Form.Item
            label="Número do lote"
            name={"lote"}
            required
            rules={[
              {
                required: true,
                message: "Forneça o número do lote",
              },
            ]}
          >
            <InputNumber
              min={0}
              onChange={(e) => {
                form.resetFields();
                form.setFieldValue("lote", e);
                getLoteData();
              }}
            ></InputNumber>
          </Form.Item>

          <Form.Item<updateData> label="Estado" required name={"state"}>
            <Select
              disabled={!validLote}
              options={[
                {
                  label: "Ativo",
                  value: "ativo",
                },
                {
                  label: "Comprometido",
                  value: "comprometido",
                },
                {
                  label: "Concluído",
                  value: "concluido",
                },
              ]}
            />
          </Form.Item>

          <Form.Item label={"Planos"} name="plans" required>
            <Select
              showSearch
              disabled={!validLote}
              mode="multiple"
              onFocus={() => getPlans()}
              options={planSearch.map((e) => ({
                label: e.name,
                value: e.id,
              }))}
            />
          </Form.Item>

          <Form.Item<updateData>
            label="Modo de operação"
            required
            name={"operationMode"}
          >
            <Select
              disabled={!validLote}
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
            />
          </Form.Item>

          <Form.Item<updateData> label="Observações" name={"observations"}>
            <TextArea disabled={!validLote}></TextArea>
          </Form.Item>

          <Form.Item<updateData> label="Razões de perda" name={"reasonLoss"}>
            <TextArea disabled={!validLote}></TextArea>
          </Form.Item>

          <Form.Item<updateData>
            label="Quantidade perdida"
            name={"quantityLoss"}
          >
            <InputNumber disabled={!validLote} min={0}></InputNumber>
          </Form.Item>

          <Form.Item<updateData>
            label="Quantidade colhida"
            name={"quantityHarvested"}
          >
            <InputNumber disabled={!validLote} min={0}></InputNumber>
          </Form.Item>

          <Form.Item<updateData> label="Fim" name={"end"}>
            <DatePicker disabled={!validLote}></DatePicker>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              style={{ width: "100%" }}
              htmlType="submit"
              disabled={!validLote}
            >
              Atualizar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
