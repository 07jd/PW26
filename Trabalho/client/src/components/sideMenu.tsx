import {
  CloudOutlined,
  EditOutlined,
  FundOutlined,
  ReadOutlined,
  StarOutlined,
  SunOutlined,
  TruckOutlined,
} from "@ant-design/icons";
import { Menu } from "antd";
import { useNavigate } from "react-router-dom";

export function SideMenu({ role }: { role: string }) {
  const navigate = useNavigate();
  const items = [
    {
      key: "",
      label: "Dashboard",
      icon: <FundOutlined />,
    },
    ...(role.toLowerCase() === "administrador"
      ? [
          {
            key: "admin",
            label: "Administração",
            icon: <StarOutlined />,
          },
        ]
      : []),
    {
      key: "erva",
      label: "Ervas",
      icon: <SunOutlined />,
      children: [
        {
          key: "erva-consultar",
          label: "Consultar",
        },
        {
          key: "erva-adicionar",
          label: "Adicionar",
        },
        {
          key: "erva-atualizar",
          label: "Atualizar",
        },
        {
          key: "erva-remover",
          label: "Remover",
        },
      ],
    },
    {
      key: "planos",
      label: "Planos",
      icon: <ReadOutlined />,
      children: [
        {
          key: "planos-consultar",
          label: "Consultar",
        },
        {
          key: "planos-adicionar",
          label: "Adicionar",
        },
        {
          key: "planos-atualizar",
          label: "Atualizar",
        },
        {
          key: "planos-remover",
          label: "Remover",
        },
      ],
    },
    {
      key: "lote",
      label: "Lotes",
      icon: <TruckOutlined />,
      children: [
        {
          key: "lote-consultar",
          label: "Consultar",
        },
        {
          key: "lote-adicionar",
          label: "Adicionar",
        },
        {
          key: "lote-atualizar",
          label: "Atualizar",
        },
        {
          key: "lote-remover",
          label: "Remover",
        },
      ],
    },
    {
      key: "tarefas",
      label: "Tarefas",
      icon: <EditOutlined />,
      children: [
        {
          key: "tarefas-consultar",
          label: "Consultar",
        },
        {
          key: "tarefas-adicionar",
          label: "Adicionar",
        },
        {
          key: "tarefas-remover",
          label: "Remover",
        },
      ],
    },
    {
      key: "metricas",
      label: "Metricas",
      icon: <CloudOutlined />,
      children: [
        {
          key: "metricas-consultar",
          label: "Consultar",
        },
        {
          key: "metricas-adicionar",
          label: "Adicionar",
        },
        {
          key: "metricas-atualizar",
          label: "Atualizar",
        },
        {
          key: "metricas-remover",
          label: "Remover",
        },
      ],
    },
  ];

  const goToPage = (info: string) => {
    if (!info.includes("-")) {
      navigate(`/dashboard/${info}`);
    } else {
      const page = info.split("-");
      navigate(`/dashboard/${page[0]}/${page[1]}`);
    }
  };

  return (
    <div>
      <Menu onClick={(e) => goToPage(e.key)} mode="inline" items={items}></Menu>
    </div>
  );
}
