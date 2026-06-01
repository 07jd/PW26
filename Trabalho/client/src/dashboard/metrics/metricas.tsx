import { useParams } from "react-router-dom";
import { Adicionar } from "./adicionar";
import { Consulta } from "./consulta";

export const endpoint = "/metric";

export function Metricas() {
  const { modo } = useParams();

  const renderPage = () => {
    if (modo === "consultar") return <Consulta />;
    return <Adicionar />;
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {renderPage()}
    </div>
  );
}
