import type { MessageInstance } from "antd/es/message/interface";
import { endpoint } from "./plano";
import { Button, Descriptions, message, Modal, Table } from "antd";
import { useEffect, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import Search from "antd/es/input/Search";
import { ReloadOutlined } from "@ant-design/icons";
import { getNewTokenIfExpired } from "../../util";

export interface tableData {
  // Base
  id: string;
  name: string;
  herb: herbData | null;
  type: string;
  // Regular
  temperature?: rangeData;
  luminosity?: rangeData;
  humidity?: rangeData;
  fertilization?: freqData;
  watering?: number;
  duration?: number;
  // Emerg
  reason?: string;
  minInterval?: number;
  dosage?: number;
  itensity?: number;
  // Pontual
  action?: string;
  approvedBy?: userData;
  done?: boolean;
  doneAt?: string;
}

interface freqData {
  frequency: number;
  quantity: number;
}

interface rangeData {
  min: number;
  max: number;
}

interface userData {
  id: string;
  username: string;
  email: string;
}

interface herbData {
  name: string;
  description: string;
  category: string;
}

async function getData(
  msg: MessageInstance,
  setLoadingPage: React.Dispatch<React.SetStateAction<boolean>>,
  setData: React.Dispatch<React.SetStateAction<tableData[]>>,
  setFiltered: React.Dispatch<React.SetStateAction<tableData[]>>,
) {
  try {
    setLoadingPage(true);
    await getNewTokenIfExpired();
    const response = await fetch(endpoint);

    if (!response.ok) {
      if (response.status === 401) {
        msg.open({
          type: "error",
          content: "A sua sessão expirou",
        });
      } else {
        msg.open({
          type: "error",
          content: "Tente novamente mais tarde",
        });
      }

      setLoadingPage(false);
      return;
    }

    const data = await response.json();
    setData(data);
    setFiltered(data);
    setLoadingPage(false);

    msg.open({
      type: "success",
      content: "Dados obtidos",
    });
  } catch (e) {
    setLoadingPage(false);
    console.log(e);
  }
}

export function Consulta() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loadingPage, setLoadingPage] = useState(false);
  const [data, setData] = useState<tableData[]>([]);
  const [filtered, setFiltered] = useState<tableData[]>([]);

  const [popup, setPopup] = useState(false);
  const [popupData, setPopupData] = useState<tableData>();

  const coluna_entries: ColumnsType<tableData> = [
    {
      title: "Nome",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Erva",
      key: "herb",
      render: (record) => record.herb?.name ?? "Desconhecido",
    },
    {
      title: "Tipo",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Mais Detalhes",
      key: "details",
      align: "center",
      render: (record: tableData) => (
        <Button
          type="default"
          onClick={() => {
            setPopup(true);
            setPopupData(record);
          }}
        >
          +
        </Button>
      ),
    },
  ];

  const safe = (v?: string | number | null) => v ?? "N/A";

  const formatRange = (r?: rangeData) => (r ? `${r.min} - ${r.max}` : "N/A");

  const formatUser = (u?: userData) =>
    u ? `${u.username} (${u.email})` : "Desconhecido";

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString() : "N/A");

  const deletePlan = async (id: string) => {
    try {
      getNewTokenIfExpired();
      const response = await fetch(`/plan/${id}`, {
        method: "DELETE",
      });

      if (response.status === 403) {
        messageApi.open({
          type: "error",
          content: "Não tens permissão para apagar a erva",
        });
        return;
      }

      if (!response.ok) throw new Error();

      messageApi.open({
        type: "success",
        content: "Erva apagada",
      });
      setPopup(false);
    } catch {
      messageApi.open({
        type: "error",
        content: "Não foi possível eliminar a erva",
      });
    }
  };

  const renderPopup = () => {
    return (
      <Modal
        open={popup}
        title="Detalhes"
        width={750}
        onCancel={() => setPopup(false)}
        footer={[
          <Button
            key="delete"
            type="primary"
            danger
            onClick={() => {
              if (popupData?.id) deletePlan(popupData.id);
              else setPopup(false);
            }}
          >
            Apagar
          </Button>,
          <Button key="ok" type="primary" onClick={() => setPopup(false)}>
            OK
          </Button>,
        ]}
      >
        {popupData && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Descriptions title="Base" bordered column={1} size="small">
              <Descriptions.Item label="Nome">
                {popupData.name}
              </Descriptions.Item>

              <Descriptions.Item label="Tipo">
                {popupData.type}
              </Descriptions.Item>

              <Descriptions.Item label="Erva">
                {popupData.herb?.name ?? "Desconhecido"}
              </Descriptions.Item>

              <Descriptions.Item label="Categoria da Erva">
                {popupData.herb?.category ?? "Desconhecido"}
              </Descriptions.Item>
            </Descriptions>

            {popupData.type === "regular" && (
              <Descriptions title="Regular" bordered column={1} size="small">
                <Descriptions.Item label="Temperatura (ºC)">
                  {formatRange(popupData.temperature)}
                </Descriptions.Item>

                <Descriptions.Item label="Luminosidade (LUX)">
                  {formatRange(popupData.luminosity)}
                </Descriptions.Item>

                <Descriptions.Item label="Humidade (%, Relativa)">
                  {formatRange(popupData.humidity)}
                </Descriptions.Item>

                <Descriptions.Item label="Fertilização (Frequencia p. mês/ Quantidade kg)">
                  {popupData.fertilization
                    ? `${popupData.fertilization.frequency}x / ${popupData.fertilization.quantity}`
                    : "N/A"}
                </Descriptions.Item>

                <Descriptions.Item label="Rega (p/dia)">
                  {safe(popupData.watering)}
                </Descriptions.Item>

                <Descriptions.Item label="Duração (dias)">
                  {safe(popupData.duration)}
                </Descriptions.Item>
              </Descriptions>
            )}

            {popupData.type === "emergencia" && (
              <Descriptions title="Emergência" bordered column={1} size="small">
                <Descriptions.Item label="Motivo">
                  {safe(popupData.reason)}
                </Descriptions.Item>

                <Descriptions.Item label="Intervalo mínimo">
                  {safe(popupData.minInterval)}
                </Descriptions.Item>

                <Descriptions.Item label="Dosagem">
                  {safe(popupData.dosage)}
                </Descriptions.Item>

                <Descriptions.Item label="Intensidade">
                  {safe(popupData.itensity)}
                </Descriptions.Item>
              </Descriptions>
            )}

            {popupData.type === "pontual" && (
              <Descriptions title="Pontual" bordered column={1} size="small">
                <Descriptions.Item label="Ação">
                  {safe(popupData.action)}
                </Descriptions.Item>

                <Descriptions.Item label="Aprovado por">
                  {formatUser(popupData.approvedBy)}
                </Descriptions.Item>

                <Descriptions.Item label="Concluído">
                  {popupData.done ? "Sim" : "Não"}
                </Descriptions.Item>

                <Descriptions.Item label="Concluído em">
                  {formatDate(popupData.doneAt)}
                </Descriptions.Item>
              </Descriptions>
            )}
          </div>
        )}
      </Modal>
    );
  };

  useEffect(() => {
    getData(messageApi, setLoadingPage, setData, setFiltered);
  }, [messageApi]);

  const filter = (name: string) => {
    if (!name || name.length === 0) {
      setFiltered(data);
      return;
    }

    const lowercased = name.toLowerCase();
    setFiltered(
      data.filter((it) => {
        return it.name.toLowerCase().includes(lowercased);
      }),
    );
  };

  return (
    <>
      {contextHolder}
      {renderPopup()}
      <div
        style={{
          width: "100%",
          maxWidth: "90%",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Search
            placeholder="Pesquisar..."
            onSearch={(value) => filter(value)}
            onClear={() => setFiltered(data)}
            allowClear
            style={{ flex: 1 }}
          />

          <Button
            icon={<ReloadOutlined />}
            onClick={() =>
              getData(messageApi, setLoadingPage, setData, setFiltered)
            }
          />
        </div>

        <Table
          loading={loadingPage}
          columns={coluna_entries}
          dataSource={filtered}
          pagination={{
            pageSize: 8,
          }}
        />
      </div>
    </>
  );
}
