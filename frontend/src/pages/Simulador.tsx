import { Link } from "react-router-dom";

export default function Simulador() {
  return (
    <div className="p-6 flex flex-col items-center">
      <Link
        to="/"
        className="inline-block mb-4 rounded-xl bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-400 transition"
      >
        ← Volver
      </Link>

      <iframe
        src="/simulador.html"
        className="w-full h-[90vh] rounded-xl border mx-auto"
        style={{ maxWidth: "1200px" }}
      />
    </div>
  );
}
