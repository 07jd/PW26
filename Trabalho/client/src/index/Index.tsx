import { Button, Layout, Typography, Space } from "antd";

const { Header, Content, Footer } = Layout;

export default function App() {
  return (
    <Layout
      style={{ height: "100vh", position: "relative", overflow: "hidden" }}
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      >
        <source src="/index.mp4" type="video/mp4" />
      </video>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 1,
        }}
      />

      <Header
        style={{
          background: "transparent",
          zIndex: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography.Title level={3} style={{ color: "white", margin: 0 }}>
          Green Herb
        </Typography.Title>

        <Button type="primary" onClick={() => window.location.replace("/auth")}>
          Iniciar sessão
        </Button>
      </Header>

      <Content
        style={{
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Space orientation="vertical" align="center">
          <Typography.Title style={{ color: "white" }}>
            Bem-vindo
          </Typography.Title>

          <Typography.Text style={{ color: "white" }}>
            Sistema de gestão de estufa
          </Typography.Text>
        </Space>
      </Content>

      <Footer
        style={{
          background: "transparent",
          textAlign: "center",
          color: "white",
          zIndex: 2,
        }}
      >
        Green Herb ©{new Date().getFullYear()}
      </Footer>
    </Layout>
  );
}
