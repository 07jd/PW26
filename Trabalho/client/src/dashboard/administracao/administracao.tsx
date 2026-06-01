import { useParams } from "react-router-dom";
import { Utilizadores } from "./utilizadores";

export function Administracao() {
  const { modo } = useParams();

  const renderPage = () => {
    if (modo === "utilizadores") return <Utilizadores />;
    return <> </>;
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
