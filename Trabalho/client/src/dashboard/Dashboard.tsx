import { Layout } from "antd";
import { Content } from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import { SideMenu } from "../components/sideMenu";
import { Route, Routes } from "react-router-dom";
import { Erva } from "./erva/erva";
import { Plano } from "./plano/plano";
import { Lote } from "./lote/lote";

export default function App() {
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
          }}
          onClick={() => {
            window.location.replace("/");
          }}
        >
          GreenHerb
        </div>
        <SideMenu role={"administrador"} />
      </Sider>
      <Content
        style={{
          height: "100%",
          overflowY: "auto",
        }}
      >
        <Routes>
          <Route path="/dashboard/erva/:modo" element={<Erva />} />
          <Route path="/dashboard/planos/:modo" element={<Plano />} />
          <Route path="/dashboard/lote/:modo" element={<Lote />} />
        </Routes>
      </Content>
    </Layout>
  );
}
