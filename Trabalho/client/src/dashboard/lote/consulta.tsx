import type { userInfo } from "../erva/consulta";
import type { MessageInstance } from "antd/es/message/interface";
import { Button, message, Modal, Table } from "antd";
import { useEffect, useState } from "react";
import { ReloadOutlined } from "@ant-design/icons";
import Search from "antd/es/input/Search";
import type { ColumnsType } from "antd/es/table";
import { getNewTokenIfExpired } from "../../util";

interface tableData {
  num: number;
  state: string;
  herb?: herb;
  plans?: plans[];
  quantityPlanted: number;
  quantityHarvested: number;
  quantityLoss: number;
  reasonLoss?: number;
  productivity: number;
  operationMode: string;
  observations?: string;
  createdBy: userInfo;
  updatedBy?: userInfo;
  start: string;
  end?: string;
}

interface plans {
  id: string;
  name: string;
  type: string;
}

interface herb {
  id: string;
  name: string;
  category: string;
}

export const endpoint = "/lote";
async function getData(
  msg: MessageInstance,
  setLoadingPage: React.Dispatch<React.SetStateAction<boolean>>,
  setData: React.Dispatch<React.SetStateAction<tableData[]>>,
  setFiltered: React.Dispatch<React.SetStateAction<tableData[]>>,
) {
  try {
    await getNewTokenIfExpired();
    setLoadingPage(true);
    const response = await fetch(`${endpoint}/search?page=-1`);

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
    console.log(data);
    setData(data);
    setFiltered(data);
    setLoadingPage(false);

    msg.open({
      type: "success",
      content: "Dados obtidos",
    });
  } catch (e) {
    setLoadingPage(false);
    msg.open({
      type: "error",
      content: "Não foi possível obter data",
    });
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
      title: "Número do Lote",
      dataIndex: "num",
      key: "num",
    },
    {
      title: "Estado",
      dataIndex: "state",
      key: "state",
    },
    {
      title: "Erva",
      dataIndex: "herb",
      key: "herb",
      render: (value: herb) => {
        return value ? value.name : "Desconhecido";
      },
    },
    {
      title: "Modo de operação",
      dataIndex: "operationMode",
      key: "operationMode",
    },
    {
      title: "Data de início",
      dataIndex: "start",
      key: "start",
    },
    {
      title: "Data de Fim",
      dataIndex: "end",
      key: "start",
      render: (value: string) => {
        return value ? value : "DNF";
      },
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

  const renderPopup = () => {
    return (
      <Modal
        open={popup}
        title="Detalhes"
        footer={[
          <Button key={"ok"} type="primary" onClick={() => setPopup(false)}>
            Ok
          </Button>,
        ]}
      >
        {popupData && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <b>Estado:</b> {popupData.state}
            </div>

            <div>
              <b>Erva:</b>{" "}
              {popupData.herb ? popupData.herb.name : "Desconhecido"}
            </div>

            <div>
              <b>Modo de operação:</b> {popupData.operationMode}
            </div>

            <div>
              <b>Plantado:</b> {popupData.quantityPlanted} ha
            </div>

            <div>
              <b>Colhido:</b> {popupData.quantityHarvested} ha
            </div>

            <div>
              <b>Perdas:</b> {popupData.quantityLoss} ha
            </div>

            <div>
              <b>Produtividade:</b> {popupData.productivity}%
            </div>

            <div>
              <b>Início:</b> {popupData.start}
            </div>

            <div>
              <b>Fim:</b> {popupData.end ?? "DNF"}
            </div>

            {popupData.observations && (
              <div>
                <b>Observações:</b>
                <div>{popupData.observations}</div>
              </div>
            )}

            {popupData.herb && (
              <div>
                <b>Categoria da erva:</b> {popupData.herb.category}
              </div>
            )}

            <div>
              <b>Criado por:</b> {popupData.createdBy.username} (
              {popupData.createdBy.email})
            </div>

            {popupData.updatedBy && (
              <div>
                <b>Atualizado por:</b> {popupData.updatedBy.username} (
                {popupData.updatedBy.email})
              </div>
            )}

            {/* PLANS */}
            {popupData.plans?.length ? (
              <div>
                <b>Plans:</b>
                <ul style={{ marginTop: 6 }}>
                  {popupData.plans.map((p) => (
                    <li key={p.id}>
                      {p.name} ({p.type})
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div>
                <b>Plans:</b> Nenhum
              </div>
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

    let lowercased = Number(name);
    if (Number.isNaN(lowercased)) lowercased = -1;

    setFiltered(
      data.filter((it) => {
        return it.num === lowercased;
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
