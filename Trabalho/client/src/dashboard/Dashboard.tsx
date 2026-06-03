import { Layout } from "antd";
import { Content } from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import { SideMenu } from "../components/sideMenu";
import { Route, Routes } from "react-router-dom";
import { Erva } from "./erva/erva";
import { Plano } from "./plano/plano";
import { Lote } from "./lote/lote";
import { Metricas } from "./metrics/metricas";
import { Administracao } from "./administracao/administracao";
import { useEffect, useState } from "react";
import { getNewTokenIfExpired } from "../util";
import LoadingSpin from "../components/loadingSpin";
import { Conta } from "./conta/conta";
import { DashboardInterface } from "./dashboard/dashboard";

interface User {
  username: string;
  email: string;
  role: string;
}

async function getUser(
  setUser: React.Dispatch<React.SetStateAction<User | null>>,
  setTried: React.Dispatch<React.SetStateAction<boolean>>,
) {
  try {
    await getNewTokenIfExpired();
    const response = await fetch("/user/me");
    if (response.ok) {
      const data = await response.json();
      console.log(data);
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
    }
  } catch (e) {
    console.log("Failed fetch user info: " + e);

    const user_raw = localStorage.getItem("user");
    if (user_raw) {
      setUser(JSON.parse(user_raw));
    }
  } finally {
    setTried(true);
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tried, setTried] = useState<boolean>(false);

  useEffect(() => {
    getUser(setUser, setTried);
  }, []);

  if (!tried) {
    return <LoadingSpin />;
  }

  if (!user) {
    return <>session expired!!!</>;
  }

  return (
    <Layout
      style={{
        height: "100vh",
        width: "100%",
        background: "#040f0f",
      }}
    >
      <Sider
        style={{
          height: "100%",
          overflowY: "auto",
          background: "white",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: "100%",
            textAlign: "center",
            padding: "16px 0",
            fontWeight: "bold",
            color: "black",
            textSizeAdjust: "auto",
            cursor: "pointer",
            userSelect: "none",
            flexShrink: 0,
          }}
          onClick={() => {
            window.location.replace("/");
          }}
        >
          GreenHerb
        </div>

        <SideMenu role={user?.role} username={user?.username} />
      </Sider>
      <Content
        style={{
          height: "100%",
          overflowY: "auto",
        }}
      >
        <Routes>
          <Route path="/dashboard/" element={<DashboardInterface />} />
          <Route path="/dashboard/account" element={<Conta />} />
          <Route path="/dashboard/admin/:modo" element={<Administracao />} />
          <Route path="/dashboard/erva/:modo" element={<Erva />} />
          <Route path="/dashboard/planos/:modo" element={<Plano />} />
          <Route path="/dashboard/lote/:modo" element={<Lote />} />
          <Route path="/dashboard/metricas/:modo" element={<Metricas />} />
        </Routes>
      </Content>
    </Layout>
  );
}
