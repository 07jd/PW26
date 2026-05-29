import { useParams } from "react-router-dom";
import { Adicionar } from "./adicionar";
import { Consulta } from "./consultar";
import { Atualizar } from "./atualizar";

export const endpoint = "/plan";

export function Plano() {
  const { modo } = useParams();

  const renderPage = () => {
    if (modo === "consultar") return <Consulta />;
    if (modo === "adicionar") return <Adicionar />;
    if (modo === "atualizar") return <Atualizar />;

    return <></>;
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
