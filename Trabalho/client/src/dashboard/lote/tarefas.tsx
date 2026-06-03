import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Flex,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Table,
  Tag,
} from "antd";
import { useEffect, useState } from "react";
import { getNewTokenIfExpired } from "../../util";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface loteData {
  id: string;
  num: string;
}

interface userData {
  id: string;
  username: string;
  email: string;
}

interface tableEntries {
  id: string;
  lote: loteData;
  state?: string;
  type?: string;
  scheduledFor?: string;
  doneAt?: string;
  doneBy?: userData;
}

const tabs = [
  {
    label: "Consultar",
    key: "consultar",
  },
  {
    label: "Adicionar",
    key: "adicionar",
  },
];

export function Tarefas() {
  const [msg, context] = message.useMessage();
  const [form] = Form.useForm();
  const [modifyForm] = Form.useForm();
  const [tab, setTab] = useState("adicionar");
  const [data, setData] = useState<tableEntries[]>([]);
  const [popup, setPopup] = useState(false);
  const [popupData, setPopupData] = useState<tableEntries | null>(null);
  const [modify, setModify] = useState(false);

  // Set data when open modify popup
  useEffect(() => {
    if (popupData && modify) {
      modifyForm.setFieldsValue({
        state: popupData.state,
        type: popupData.type,
        scheduledFor: popupData.scheduledFor
          ? dayjs(popupData.scheduledFor)
          : undefined,
        doneAt: popupData.doneAt ? dayjs(popupData.doneAt) : undefined,
      });
    }
  }, [popupData, modify, modifyForm]);

  const getLoteTasks = async () => {
    try {
      await getNewTokenIfExpired();
      const id = form.getFieldValue("lote");
      const response = await fetch(`/task/${id}`);

      if (response.ok) {
        const raw = await response.json();
        setData(raw);
        return;
      }

      if (response.status === 404) {
        msg.open({
          type: "error",
          content: "Lote não existe",
        });
        setData([]);
        return;
      }
    } catch (e) {
      msg.open({
        type: "error",
        content: "Não foi possível obter a data",
      });
      setData([]);
      console.log(e);
    }
  };

  const createTask = async (data: tableEntries) => {
    try {
      await getNewTokenIfExpired();
      const id = form.getFieldValue("lote");

      console.log(data);
      const response = await fetch(`/task/${id}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        form.resetFields();
        msg.open({
          type: "success",
          content: "Tarefa criada",
        });
        return;
      }

      if (response.status === 404) {
        msg.open({
          type: "error",
          content: "Lote não existe",
        });
        return;
      }

      const errors = (await response.json()).errors;
      for (const [key, val] of Object.entries(errors)) {
        if (key.includes("lote")) {
          form.setFields([
            {
              name: "lote",
              errors: [String(val)],
            },
          ]);
        }

        if (key.includes("doneAt")) {
          form.setFields([
            {
              name: "doneAt",
              errors: [String(val)],
            },
          ]);
        }

        if (key.includes("scheduledFor")) {
          form.setFields([
            {
              name: "scheduledFor",
              errors: [String(val)],
            },
          ]);
        }
      }
    } catch {
      msg.open({
        type: "error",
        content: "Não foi possível criar a tarefa",
      });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await getNewTokenIfExpired();
      const response = await fetch(`/task/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error();

      msg.open({
        type: "success",
        content: "Tarefa apagada",
      });
      setData((prev) => prev.filter((t) => t.id !== id));
      setModify(false);
      setPopup(false);
    } catch {
      msg.open({
        type: "error",
        content: "Não foi possível apagar a tarefa",
      });
    }
  };

  const updateTask = async () => {
    let values;
    try {
      values = await modifyForm.validateFields();
    } catch {
      return;
    }

    try {
      await getNewTokenIfExpired();
      const id = popupData?.id;
      if (!id) return;

      const response = await fetch(`/task/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        modifyForm.resetFields();

        msg.open({
          type: "success",
          content: "Tarefa atualizada",
        });

        setData((prev) =>
          prev.map((t) => (t.id === popupData!.id ? { ...t, ...values } : t)),
        );
        setModify(false);
        return;
      }

      const errors = (await response.json()).errors;
      for (const [key, value] of Object.entries(errors)) {
        if (key.includes("type")) {
          modifyForm.setFields([
            {
              name: "type",
              errors: [String(value)],
            },
          ]);
        }

        if (key.includes("state")) {
          modifyForm.setFields([
            {
              name: "state",
              errors: [String(value)],
            },
          ]);
        }

        if (key.includes("scheduledFor")) {
          modifyForm.setFields([
            {
              name: "scheduledFor",
              errors: [String(value)],
            },
          ]);
        }

        if (key.includes("doneAt")) {
          modifyForm.setFields([
            {
              name: "doneAt",
              errors: [String(value)],
            },
          ]);
        }
      }
    } catch {
      console.log("not possible to update");
      msg.open({
        type: "error",
        content: "Não foi possível atualizar a tarefa",
      });
    }
  };

  const renderPopup = () => {
    if (!popupData) {
      return <Modal onCancel={() => setPopup(false)}>No data</Modal>;
    }

    return (
      <Modal
        open={popup}
        title="Detalhes"
        width={750}
        onCancel={() => setPopup(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setPopup(false)}>
            OK
          </Button>,
        ]}
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="ID">{popupData.id}</Descriptions.Item>

          <Descriptions.Item label="Estado">
            <Tag color={popupData.state === "concluido" ? "green" : "blue"}>
              {popupData.state}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Agendado para">
            {popupData.scheduledFor
              ? new Date(popupData.scheduledFor).toLocaleString()
              : "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Concluído em">
            {popupData.doneAt
              ? new Date(popupData.doneAt).toLocaleString()
              : "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Concluído por">
            {popupData.doneBy?.username ?? "-"}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    );
  };

  const renderModifyPopup = () => {
    if (!popupData) {
      return <Modal onCancel={() => setModify(false)}>No data</Modal>;
    }

    return (
      <Modal
        open={modify}
        title="Atualizar"
        width={750}
        onCancel={() => setModify(false)}
        footer={[
          <Button
            key="delete"
            danger
            type="primary"
            onClick={() => deleteTask(popupData.id)}
            style={{ marginRight: "auto" }}
          >
            Apagar
          </Button>,

          <Button
            key="update"
            type="primary"
            htmlType="submit"
            onClick={() => updateTask()}
          >
            Atualizar
          </Button>,

          <Button key="cancel" type="default" onClick={() => setModify(false)}>
            Sair sem Atualizar
          </Button>,
        ]}
      >
        <Form form={modifyForm} layout="vertical" onFinish={updateTask}>
          <Form.Item label="ID">
            <Input value={popupData.id} disabled />
          </Form.Item>

          <Flex gap={12}>
            <Form.Item
              required
              label="Estado"
              name="state"
              style={{ flex: 1 }}
              rules={[
                {
                  required: true,
                  message: "Estado necessário",
                },
              ]}
            >
              <Select
                options={[
                  {
                    label: "Concluído",
                    value: "concluido",
                  },
                  {
                    label: "Pendente",
                    value: "pendente",
                  },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Tipo"
              name="type"
              style={{ flex: 1 }}
              required
              rules={[
                {
                  required: true,
                  message: "Estado necessário",
                },
              ]}
            >
              <Select
                options={[
                  {
                    label: "Rega",
                    value: "rega",
                  },
                  {
                    label: "Fertilização",
                    value: "fertilizacao",
                  },
                  {
                    label: "Colheita",
                    value: "colheita",
                  },
                  {
                    label: "Monitorização",
                    value: "monitorizacao",
                  },
                  {
                    label: "Ventilação",
                    value: "ventilar",
                  },
                  {
                    label: "Alterar exposição (luz)",
                    value: "controlo_luz",
                  },
                ]}
              />
            </Form.Item>
          </Flex>

          <Flex orientation="horizontal" gap={12}>
            <Form.Item
              label="Agendado para"
              name="scheduledFor"
              style={{ flex: 1 }}
            >
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item label="Concluído em" name="doneAt" style={{ flex: 1 }}>
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
          </Flex>
        </Form>
      </Modal>
    );
  };

  const renderPage = () => {
    if (tab === "adicionar") {
      return (
        <Form form={form} onFinish={createTask}>
          <Form.Item
            label="Número do Lote"
            required
            name={"lote"}
            rules={[
              {
                required: true,
                message: "Número do Lote necessário",
              },
            ]}
          >
            <InputNumber min={0} />
          </Form.Item>

          <Form.Item
            label="Tipo"
            required
            name="type"
            rules={[
              {
                required: true,
                message: "Tipo de tarefa necessária",
              },
            ]}
          >
            <Select
              options={[
                {
                  label: "Rega",
                  value: "rega",
                },
                {
                  label: "Fertilização",
                  value: "fertilizacao",
                },
                {
                  label: "Colheita",
                  value: "colheita",
                },
                {
                  label: "Monitorização",
                  value: "monitorizacao",
                },
                {
                  label: "Ventilação",
                  value: "ventilar",
                },
                {
                  label: "Alterar exposição (luz)",
                  value: "controlo_luz",
                },
              ]}
            />
          </Form.Item>

          <Form.Item label="Terminar até" name={"scheduledFor"}>
            <DatePicker showTime />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
              Criar
            </Button>
          </Form.Item>
        </Form>
      );
    }

    const columns: ColumnsType<tableEntries> = [
      {
        title: "Estado",
        dataIndex: "state",
        key: "state",
      },
      {
        title: "Tipo",
        dataIndex: "type",
        key: "type",
      },
      {
        title: "Agendado para",
        dataIndex: "scheduledFor",
        key: "scheduledFor",
        render: (value: string) => dayjs(value).format("DD/MM/YYYY HH:mm"),
      },
      {
        title: "Mais Detalhes",
        key: "details",
        align: "center",
        render: (selected: tableEntries) => (
          <Button
            type="default"
            onClick={() => {
              setPopup(true);
              setPopupData(selected);
            }}
          >
            +
          </Button>
        ),
      },
      {
        title: "Modificar",
        key: "modify",
        align: "center",
        render: (selected: tableEntries) => (
          <Button
            type="primary"
            onClick={() => {
              setModify(true);
              setPopupData(selected);
            }}
          >
            O
          </Button>
        ),
      },
    ];

    return (
      <>
        <Form>
          <Form.Item required label="Número do Lote" name={"lote"}>
            <InputNumber min={0} onChange={getLoteTasks}></InputNumber>
          </Form.Item>
        </Form>

        <Table columns={columns} dataSource={data}></Table>
      </>
    );
  };

  return (
    <>
      {context}
      {renderPopup()}
      {renderModifyPopup()}
      <Card
        style={{ minWidth: "60%" }}
        tabList={tabs}
        onTabChange={(e) => {
          setTab(e);
          setData([]);
          form.resetFields();
          getLoteTasks();
        }}
        activeTabKey={tab}
      >
        {renderPage()}
      </Card>
    </>
  );
}
