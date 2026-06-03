import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Statistic,
  Typography,
  message,
} from "antd";
import { getNewTokenIfExpired } from "../../util";

async function authFetch(url: string, opt = {}) {
  await getNewTokenIfExpired();
  return fetch(url, opt);
}

const DASHBOARD_ENDPOINT = "/stats";
const ALERTS_ENDPOINT = "/alert";
const ALERT_ENDPOINT = (id: string) => `/alert/${id}`;

type DashboardData = {
  avgTime: number;
  lateTasks: number;
  activeLotes: number;
};

type DashboardAlert = {
  id: string;
  level: "info" | "warning" | "urgent";
  description: string;
  createdAt: string;
};

export function DashboardInterface() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [ignoreForm] = Form.useForm();
  const [ignoreModalOpen, setIgnoreModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<DashboardAlert | null>(
    null,
  );

  const load = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        authFetch(DASHBOARD_ENDPOINT),
        authFetch(ALERTS_ENDPOINT),
      ]);

      if (!statsRes.ok || !alertsRes.ok) throw new Error("API error");

      const statsData: DashboardData = await statsRes.json();
      const alertsData: DashboardAlert[] = await alertsRes.json();

      setStats(statsData);
      setAlerts(alertsData);
    } catch {
      message.error({
        type: "error",
        content: "Não foi possível carregar dashboard",
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resolveAlert = async (id: string) => {
    await authFetch(ALERT_ENDPOINT(id), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "resolvido" }),
    });

    setAlerts((prev) => prev.filter((a) => a.id !== id));
    message.success("Alerta resolvido");
  };

  const openIgnoreModal = (alert: DashboardAlert) => {
    setSelectedAlert(alert);
    setIgnoreModalOpen(true);
  };

  const ignoreAlert = async () => {
    const values = await ignoreForm.validateFields();

    if (!selectedAlert) return;

    await authFetch(ALERT_ENDPOINT(selectedAlert.id), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "ignorado",
        ignoreReason: values.reason,
      }),
    });

    setAlerts((prev) => prev.filter((a) => a.id !== selectedAlert.id));
    setIgnoreModalOpen(false);
    setSelectedAlert(null);
    ignoreForm.resetFields();
  };

  const mapAlertType = (level: DashboardAlert["level"]) => {
    switch (level) {
      case "urgent":
        return "error";
      case "warning":
        return "warning";
      default:
        return "info";
    }
  };

  return (
    <>
      <Row gutter={16} style={{ height: "100%" }}>
        <Row gutter={16} style={{ flex: 1, paddingLeft: 16, paddingTop: 16 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Tempo médio"
                value={stats?.avgTime?.toFixed(2) ?? 0}
                suffix="min"
              />
              <Typography.Text type="secondary">
                Duração média das tarefas
              </Typography.Text>
            </Card>
          </Col>

          <Col span={8}>
            <Card>
              <Statistic title="Em atraso" value={stats?.lateTasks ?? 0} />
              <Typography.Text type="secondary">
                Necessitam atenção
              </Typography.Text>
            </Card>
          </Col>

          <Col span={8}>
            <Card>
              <Statistic title="Lotes ativos" value={stats?.activeLotes ?? 0} />
              <Typography.Text type="secondary">
                Atualmente em execução
              </Typography.Text>
            </Card>
          </Col>
        </Row>

        <Col span={8}>
          <Card
            title="Alertas"
            style={{
              height: "calc(100vh - 24px)",
              display: "flex",
              flexDirection: "column",
            }}
            styles={{
              body: {
                flex: 1,
                overflowY: "auto",
                padding: 12,
              },
            }}
          >
            <Space orientation="vertical" style={{ width: "100%" }}>
              {alerts.map((alert) => (
                <Alert
                  key={alert.id}
                  type={mapAlertType(alert.level)}
                  description={alert.description}
                  showIcon
                  action={
                    <Space>
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Resolver
                      </Button>

                      <Button
                        size="small"
                        danger
                        onClick={() => openIgnoreModal(alert)}
                      >
                        Ignorar
                      </Button>
                    </Space>
                  }
                />
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Ignorar alerta"
        open={ignoreModalOpen}
        onCancel={() => {
          setIgnoreModalOpen(false);
          setSelectedAlert(null);
          ignoreForm.resetFields();
        }}
        onOk={ignoreAlert}
      >
        <Form form={ignoreForm} layout="vertical">
          <Form.Item
            label="Motivo"
            name="reason"
            rules={[{ required: true, message: "Insere um motivo" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
