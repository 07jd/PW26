import type { MessageInstance } from "antd/es/message/interface";
import { query_endpoint } from "./erva";
import { Button, Descriptions, message, Modal, Table } from "antd";
import { useEffect, useState } from "react";
import { ReloadOutlined } from "@ant-design/icons";
import Search from "antd/es/input/Search";
import type { ColumnsType } from "antd/es/table";
import { getNewTokenIfExpired } from "../../util";

// Data for the table
interface tableData {
  id: string;
  name: string;
  description: string;
  category: string;
  createdBy?: userInfo;
  createdAt: Date;
  updatedBy?: userInfo;
  updatedAt?: Date;
}

export interface userInfo {
  id: string;
  username: string;
  email: string;
}

async function getData(
  msg: MessageInstance,
  setLoadingPage: React.Dispatch<React.SetStateAction<boolean>>,
  setData: React.Dispatch<React.SetStateAction<tableData[]>>,
  setFiltered: React.Dispatch<React.SetStateAction<tableData[]>>,
) {
  try {
    await getNewTokenIfExpired();
    setLoadingPage(true);
    const response = await fetch(`${query_endpoint}?page=-1`);

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
      title: "Categoria",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Descrição",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Data de Criação",
      dataIndex: "createdAt",
      key: "createdAt",
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
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="Nome">{popupData.name}</Descriptions.Item>

            <Descriptions.Item label="Categoria">
              {popupData.category}
            </Descriptions.Item>

            <Descriptions.Item label="Descrição">
              {popupData.description}
            </Descriptions.Item>

            <Descriptions.Item label="Criado em">
              {new Date(popupData.createdAt).toLocaleString()}
            </Descriptions.Item>

            <Descriptions.Item label="Criado por">
              {popupData.createdBy?.username} ({popupData.createdBy?.email})
            </Descriptions.Item>

            <Descriptions.Item label="Atualizado em">
              {popupData.updatedAt
                ? new Date(popupData.updatedAt).toLocaleString()
                : "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Atualizado por">
              {popupData.updatedBy?.username
                ? `${popupData.updatedBy.username} (${popupData.updatedBy.email})`
                : "-"}
            </Descriptions.Item>
          </Descriptions>
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
