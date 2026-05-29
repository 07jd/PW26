import { MailOutlined } from "@ant-design/icons";
import type { FormInstance } from "@rc-component/form";
import { Alert, Button, Card, Form, Input } from "antd";
import { useEffect, useState } from "react";
import Spinner from "../components/loadingSpin";

const login_endpoint = "/user/login";
const refresh_ednpoint = "/user/refresh";
interface LoginData {
  email?: string;
  password?: string;
}

type setBool = React.Dispatch<React.SetStateAction<boolean>>;
type setString = React.Dispatch<React.SetStateAction<string>>;

// Attempt login
async function login(
  data: LoginData,
  form: FormInstance<LoginData>,
  setLoading: setBool,
  setGenericError: setString,
) {
  try {
    setLoading(true);
    const response = await fetch(login_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (response.ok) {
      setLoading(true);
      window.location.replace("/dashboard");
      return;
    }

    if (response.status === 500) {
      throw new Error();
    }

    const msg = await response.json();
    for (const [type, err_msg] of Object.entries(msg.errors)) {
      if (
        type.includes("identifier") ||
        type.includes("email") ||
        type.includes("user")
      ) {
        form.setFields([
          {
            name: "email",
            errors: [String(err_msg)],
          },
        ]);
      } else {
        form.setFields([
          {
            name: "password",
            errors: [String(err_msg)],
          },
        ]);
      }
    }
    setLoading(false);
  } catch {
    setGenericError("Tente novamente mais tarde.");
    setLoading(false);
  }
}

// Hit /refresh to get new access token
async function getAccessToken(setLoading: setBool) {
  try {
    const response = await fetch(refresh_ednpoint, {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) {
      window.location.replace("/dashboard");
      return;
    }
  } finally {
    setLoading(true);
  }
}

export default function App() {
  const [loginForm] = Form.useForm();
  const [attemptingLogin, setAttemptingLogin] = useState(false);
  const [genericError, setGenericError] = useState("");
  const [refreshDone, setRefresh] = useState(false);

  useEffect(() => {
    getAccessToken(setRefresh);
  }, []);

  // Wait
  if (!refreshDone) return <Spinner />;

  // Render error alert when cant login due to error 500
  const renderAlert = () => {
    if (genericError.length === 0) return <></>;

    return (
      <Alert
        type="error"
        showIcon
        description={genericError}
        closable={{
          closeIcon: true,
          onClose: () => {
            setGenericError("");
          },
        }}
        style={{
          marginTop: "12px",
        }}
      />
    );
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#040f0f",
      }}
    >
      <Card
        title="Iniciar Sessão"
        variant="outlined"
        extra={
          <Button
            type="link"
            onClick={() => {
              window.location.replace("/");
            }}
          >
            Voltar
          </Button>
        }
        style={{
          width: "100%",
          maxWidth: "375px",
        }}
      >
        <Form
          name="login"
          layout="vertical"
          form={loginForm}
          onFinish={(data) => {
            login(data, loginForm, setAttemptingLogin, setGenericError);
          }}
        >
          <Form.Item<LoginData>
            name="email"
            label="Email"
            rules={[
              {
                required: true,
                message: "Introduza o seu email",
              },
              {
                type: "email",
                message: "Email inválido",
              },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="joao@gmail.com" />
          </Form.Item>

          <Form.Item<LoginData>
            name="password"
            label="Palavra-Passe"
            rules={[
              {
                required: true,
                message: "Introduza a sua palavra-passe",
              },
              {
                min: 8,
                message: "Palavra-passe muito curta",
              },
            ]}
          >
            <Input.Password placeholder="********" />
          </Form.Item>

          <Form.Item>
            <Button
              block
              loading={attemptingLogin}
              type="primary"
              htmlType="submit"
              style={{ width: "100%" }}
            >
              Iniciar Sessão
            </Button>
          </Form.Item>
        </Form>

        {renderAlert()}
      </Card>
    </div>
  );
}
