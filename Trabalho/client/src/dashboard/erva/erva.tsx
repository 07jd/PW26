import { useParams } from "react-router-dom";
import { Consulta } from "./consulta";
import { Atualizar } from "./atualizar";
import { Adicionar } from "./adicionar";

export const query_endpoint = "/herb/search";
export const main_endpoint = "/herb";
export const upload_endpoint = "/herb/upload";

// Data for select menus
export interface herbEntryData {
  id: string;
  name: string;
}

export function Erva() {
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
