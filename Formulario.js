import MesaAtencion from "./MesaAtencion";
import Formulario from "./Formulario";

export default function App() {
  const path = window.location.pathname;
  if (path === "/formulario") return <Formulario />;
  return <MesaAtencion />;
}
