import { useParams } from "react-router-dom";
import { Consulta } from "./consulta";
import { Adicionar } from "./adicionar";
import { Atualizar } from "./atualizar";

export function Lote() {
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
