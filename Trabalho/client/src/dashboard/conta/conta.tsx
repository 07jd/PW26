import { Button, Card, Descriptions, Form, Input, message } from "antd";
import { useEffect, useState } from "react";
import { getNewTokenIfExpired } from "../../util";
import Text from "antd/es/typography/Text";

interface formPatch {
  username?: string;
  email?: string;
  role?: string;
  password?: string;
  confirmPassword?: string;
}

const tabs = [
  {
    key: "info",
    tab: "Informações",
  },
  {
    key: "update",
    tab: "Atualizar dados",
  },
];

async function logout() {
  try {
    await fetch("/user/logout", {
      method: "POST",
      credentials: "include",
    });
  } finally {
    window.location.replace("/");
  }
}

export function Conta() {
  const [tab, setTab] = useState("info");
  const [form] = Form.useForm();
  const [msg, context] = message.useMessage();
  const [data, setData] = useState<formPatch>();

  useEffect(() => {
    const getInfo = async () => {
      try {
        await getNewTokenIfExpired();
        const response = await fetch("/user/me");
        if (!response.ok) throw new Error();

        const u_data = await response.json();
        setData(u_data);
      } catch {
        msg.open({
          type: "error",
          content: "Não foi possível obter os seus dados",
        });
      }
    };
    getInfo();
  }, [msg]);

  useEffect(() => {
    form.setFieldsValue(data);
  }, [form, data]);

  const patchUser = async (data: formPatch) => {
    const { confirmPassword, ...patch } = data;
    if (data.password) {
      if (!confirmPassword || confirmPassword !== patch.password) {
        form.setFields([
          {
            name: "confirmPassword",
            errors: ["Passwords não coincidem"],
          },
        ]);
        return;
      }
    }

    try {
      await getNewTokenIfExpired();
      const response = await fetch("/user", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      });

      if (response.ok) {
        form.setFields(
          form.getFieldsError().map((field) => ({
            name: field.name,
            errors: [],
          })),
        );

        form.setFieldsValue({
          password: undefined,
          confirmPassword: undefined,
        });

        msg.open({
          type: "success",
          content: "Dados atualizados com suceso",
        });
        return;
      }

      const errors_msg = (await response.json()).errors;
      for (const [key, value] of Object.entries(errors_msg)) {
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
      }
    } catch (e) {
      console.log(e);
      msg.open({
        type: "error",
        content: "Não foi possível atualizar os seus dados",
      });
    }
  };

  const renderTab = () => {
    if (tab === "info") {
      return (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Username">
            <Text>{data?.username}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Email">
            <Text>{data?.email}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Papel">
            <Text>{data?.role}</Text>
          </Descriptions.Item>
        </Descriptions>
      );
    }

    return (
      <Form form={form} onFinish={patchUser}>
        <Form.Item<formPatch> label="Username" name={"username"}>
          <Input></Input>
        </Form.Item>

        <Form.Item<formPatch> label="Email" name={"email"}>
          <Input></Input>
        </Form.Item>

        <Form.Item<formPatch> label="Nova Password" name={"password"}>
          <Input.Password></Input.Password>
        </Form.Item>

        <Form.Item<formPatch>
          label="Confirme a password"
          name="confirmPassword"
        >
          <Input.Password></Input.Password>
        </Form.Item>

        <Form.Item>
          <Button type="primary" style={{ width: "100%" }} htmlType="submit">
            Atualizar Dados
          </Button>
        </Form.Item>
      </Form>
    );
  };

  return (
    <>
      {context}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <Card
          style={{ minWidth: "60%" }}
          title="Detalhes da Conta"
          tabList={tabs}
          onTabChange={setTab}
          activeTabKey={tab}
          extra={
            <Button type="link" danger onClick={logout}>
              Terminar Sessão
            </Button>
          }
        >
          {renderTab()}
        </Card>
      </div>
    </>
  );
}
