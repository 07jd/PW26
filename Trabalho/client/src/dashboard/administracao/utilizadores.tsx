import { Button, Card, Form, Input, message, Select, Table } from "antd";
import { useState } from "react";
import { getNewTokenIfExpired } from "../../util";

const tabs = [
  {
    key: "consult",
    tab: "Consultar",
  },
  {
    key: "add",
    tab: "Adicionar",
  },
  {
    key: "update",
    tab: "Atualizar",
  },
];

interface userForm {
  id?: string;
  username: string;
  email: string;
  password?: string;
  role: string;
}

export function Utilizadores() {
  const [form] = Form.useForm();
  const [tab, setTab] = useState("add");
  const [msg, context] = message.useMessage();
  const [data, setData] = useState<userForm[]>([]);
  const [id, setId] = useState("");

  const getUserData = async () => {
    try {
      await getNewTokenIfExpired();
      const response = await fetch("/user/");

      if (response.status === 403) {
        msg.open({
          type: "error",
          content: "Não tem permissão para isto",
        });
        return;
      }

      const raw_data = await response.json();
      setData(raw_data);
    } catch (e) {
      msg.open({
        type: "error",
        content: "Falha ao obter dados dos utilizadores",
      });
      console.log(e);
    }
  };

  const createUser = async (data: userForm) => {
    try {
      await getNewTokenIfExpired();

      console.log(data);

      const response = await fetch("/user/register", {
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
          content: "Utilizador criado",
        });
        return;
      }

      if (response.status === 403) {
        msg.open({
          type: "error",
          content: "Não tem permissão para realizar esta operação",
        });
        return;
      }

      const error_msg = (await response.json()).errors;
      for (const [key, value] of Object.entries(error_msg)) {
        if (key.includes("username")) {
          form.setFields([
            {
              name: "username",
              errors: [String(value)],
            },
          ]);
        }

        if (key.includes("email")) {
          form.setFields([
            {
              name: "email",
              errors: [String(value)],
            },
          ]);
        }

        if (key.includes("password")) {
          form.setFields([
            {
              name: "password",
              errors: [String(value)],
            },
          ]);
        }

        if (key.includes("role")) {
          form.setFields([
            {
              name: "role",
              errors: [String(value)],
            },
          ]);
        }
      }
    } catch (e) {
      console.log(e);
      msg.open({
        type: "error",
        content: "Não foi possível criar o utilizador",
      });
    }
  };

  const updateUser = async (data: userForm) => {
    try {
      await getNewTokenIfExpired();
      const response = await fetch(`/user/update/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        msg.open({
          type: "success",
          content: "Utilizador atualizado",
        });
        return;
      }

      if (response.status === 403) {
        msg.open({
          type: "error",
          content: "Não tem permissão para realizar esta operação",
        });
        return;
      }

      const error_msg = (await response.json()).errors;
      for (const [key, value] of Object.entries(error_msg)) {
        if (key.includes("username")) {
          form.setFields([
            {
              name: "username",
              errors: [String(value)],
            },
          ]);
        }

        if (key.includes("email")) {
          form.setFields([
            {
              name: "email",
              errors: [String(value)],
            },
          ]);
        }

        if (key.includes("password")) {
          form.setFields([
            {
              name: "password",
              errors: [String(value)],
            },
          ]);
        }

        if (key.includes("role")) {
          form.setFields([
            {
              name: "role",
              errors: [String(value)],
            },
          ]);
        }
      }
    } catch (e) {
      console.log(e);
      msg.open({
        type: "error",
        content: "Não foi possível criar o utilizador",
      });
    }
  };

  const renderForm = (updateMode: boolean) => {
    return (
      <Form form={form} onFinish={updateMode ? updateUser : createUser}>
        <Form.Item<userForm>
          label="Username"
          name={"username"}
          required
          rules={[
            {
              required: true,
              message: "Forneça o username",
            },
          ]}
        >
          <Input disabled={updateMode && id.length === 0}></Input>
        </Form.Item>

        <Form.Item<userForm>
          label="Email"
          name={"email"}
          required
          rules={[
            {
              required: true,
              message: "Forneça o email",
            },
            {
              type: "email",
              message: "Email inválido",
            },
          ]}
        >
          <Input disabled={updateMode && id.length === 0}></Input>
        </Form.Item>

        <Form.Item<userForm>
          name={"role"}
          label="Papel"
          required
          rules={[
            {
              required: true,
              message: "Papel do utilizador obrgatório",
            },
          ]}
        >
          <Select
            disabled={updateMode && id.length === 0}
            options={[
              {
                label: "Técnico",
                value: "Técnico",
              },
              {
                label: "Responsável",
                value: "Responsável",
              },
              {
                label: "Administrador",
                value: "Administrador",
              },
            ]}
          />
        </Form.Item>

        <Form.Item<userForm>
          label="Palavra-Passe"
          name={"password"}
          rules={[
            {
              required: !updateMode,
              message: "Forneça a palavra passe",
            },
            {
              min: 8,
              message: "Palavra passe demasiadamente curta",
            },
          ]}
        >
          <Input.Password
            disabled={updateMode && id.length === 0}
          ></Input.Password>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            style={{ width: "100%" }}
            htmlType="submit"
            disabled={updateMode && id.length === 0}
          >
            {updateMode ? "Atualizar" : "Criar"}
          </Button>
        </Form.Item>
      </Form>
    );
  };

  const renderTable = () => {
    const columns = [
      {
        title: "Username",
        dataIndex: "username",
        key: "username",
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
      },
      {
        title: "Papel",
        dataIndex: "role",
        key: "role",
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={data}
        pagination={{
          pageSize: 8,
        }}
      ></Table>
    );
  };

  const renderTab = () => {
    if (tab === "add") {
      return <>{renderForm(false)}</>;
    }

    if (tab === "update") {
      return (
        <>
          <Form>
            <Form.Item
              label="Utilizador a Modificar"
              required
              rules={[
                {
                  required: true,
                  message: "Selecione um utilizador",
                },
              ]}
            >
              <Select
                onFocus={getUserData}
                allowClear
                showSearch={{
                  optionFilterProp: "label",
                }}
                options={data.map((e) => ({
                  label: e.email,
                  value: e.id,
                }))}
                onClear={() => {
                  setId("");
                  form.resetFields();
                }}
                onSelect={(id) => {
                  setId(id);
                  const user = data.find((p) => p.id === id);
                  if (user) form.setFieldsValue(user);
                }}
              ></Select>
            </Form.Item>
          </Form>
          {renderForm(true)}
        </>
      );
    }

    return renderTable();
  };

  return (
    <>
      {context}
      <Card
        tabList={tabs}
        style={{ minWidth: "60%" }}
        activeTabKey={tab}
        onTabChange={(nt) => {
          setTab(nt);
          setId("");
          getUserData();
          form.resetFields();
        }}
      >
        {renderTab()}
      </Card>
    </>
  );
}
