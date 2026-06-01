import { Button, Card, Form, Input, message, Select } from "antd";
import { useState } from "react";
import { main_endpoint, query_endpoint, type herbEntryData } from "./erva";
import { getEntries } from "./shared";
import { getNewTokenIfExpired } from "../../util";

// Data for post
export interface formPostData {
  name?: string;
  description?: string;
  category?: string;
}

export function Atualizar() {
  const [data, setData] = useState<herbEntryData[]>([]);
  const [form] = Form.useForm();
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [selectedHerb, setSelectedHerb] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const getHerbInfo = async (id: string) => {
    try {
      await getNewTokenIfExpired();
      const response = await fetch(`${query_endpoint}?id=${id}`);
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        form.setFields([
          { name: "name", value: data.name },
          { name: "category", value: data.category },
          { name: "description", value: data.description },
        ]);

        setSelectedHerb(true);
        return;
      }

      if (response.status === 401) {
        messageApi.open({
          type: "error",
          content: "Sessão inválida",
        });
        return;
      }

      throw Error;
    } catch (e) {
      messageApi.open({
        type: "error",
        content:
          "Não foi possível obter detalhes desta erva, tente novamente mais tarde",
      });
      console.log(e);
    }
  };

  const updateInfo = async (data: formPostData) => {
    try {
      await getNewTokenIfExpired();
      const id = form.getFieldValue("select_herb");
      const response = await fetch(`${main_endpoint}/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        messageApi.open({
          type: "success",
          content: "Erva atualizada",
        });

        form.resetFields();
        return;
      }

      if (response.status === 401) {
        messageApi.open({
          type: "error",
          content: "Sessão inválida",
        });

        return;
      }

      const error_msg = await response.json();

      if (error_msg.errors.name) {
        form.setFields([
          {
            name: "name",
            errors: [String(error_msg.errors.name)],
          },
        ]);
        return;
      }

      throw Error;
    } catch (e) {
      console.log(e);
      messageApi.open({
        type: "error",
        content: "Não foi possível atualizar a erva",
      });
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
        <Form layout="vertical" form={form} onFinish={updateInfo}>
          <Form.Item
            label="Seleciona uma erva"
            name="select_herb"
            required
            rules={[
              {
                required: true,
                message: "Forneça a erva a modificar",
              },
            ]}
          >
            <Select
              showSearch={{
                optionFilterProp: "label",
              }}
              placeholder="Manjericão"
              loading={loadingEntries}
              allowClear={true}
              onFocus={() => getEntries(messageApi, setLoadingEntries, setData)}
              options={data.map((i) => ({
                label: i.name,
                value: i.id,
              }))}
              onSelect={(id) => getHerbInfo(id)}
              onDeselect={() => {
                form.resetFields();
                setSelectedHerb(false);
              }}
              onClear={() => {
                form.resetFields();
                setSelectedHerb(false);
              }}
            />
          </Form.Item>

          <Form.Item<formPostData> required label="Nome" name="name">
            <Input disabled={!selectedHerb}></Input>
          </Form.Item>

          <Form.Item<formPostData> required label="Categoria" name="category">
            <Select
              disabled={!selectedHerb}
              placeholder="Selecione a caregoria"
              options={[
                { label: "Aromática", value: "aromática" },
                { label: "Culinária", value: "culinaria" },
                { label: "Medicinal", value: "medicinal" },
                { label: "Outra", value: "outro" },
              ]}
            />
          </Form.Item>

          <Form.Item<formPostData>
            required
            label="Descrição"
            name="description"
          >
            <Input.TextArea disabled={!selectedHerb}></Input.TextArea>
          </Form.Item>

          <Form.Item>
            <Button
              disabled={!selectedHerb}
              type="primary"
              htmlType="submit"
              style={{ width: "100%" }}
            >
              Atualizar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
