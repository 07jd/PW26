import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";

function spinCentered() {
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
      <Spin size="large" indicator={<LoadingOutlined />} />
    </div>
  );
}

export default spinCentered;
