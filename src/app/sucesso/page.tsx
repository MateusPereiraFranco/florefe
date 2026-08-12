"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function SucessoPage() {
  const [pixData, setPixData] = useState<any>(null);
  const [copiado, setCopiado] = useState(false);
  const [tempoRestante, setTempoRestante] = useState<string>("--:--");
  const [expirado, setExpirado] = useState(false);

  useEffect(() => {
    const pixSalvo = localStorage.getItem("@FloresEFe:pix");
    if (pixSalvo) {
      setPixData(JSON.parse(pixSalvo));
    }
  }, []);

  // Efeito para rodar o cronômetro
  useEffect(() => {
    if (!pixData?.expiracao) return;

    const atualizarCronometro = () => {
      const agora = new Date().getTime();
      const limite = new Date(pixData.expiracao).getTime();
      const diferenca = limite - agora;

      if (diferenca <= 0) {
        setExpirado(true);
        setTempoRestante("00:00");
        return;
      }

      // Calcula os minutos e segundos
      const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);

      // Formata para ficar com dois zeros (ex: 09:05)
      setTempoRestante(
        `${minutos.toString().padStart(2, "0")}:${segundos.toString().padStart(2, "0")}`,
      );
    };

    atualizarCronometro(); // Chama a primeira vez imediatamente
    const intervalo = setInterval(atualizarCronometro, 1000); // Atualiza a cada 1 segundo

    return () => clearInterval(intervalo);
  }, [pixData]);

  const handleCopiarPix = () => {
    if (pixData?.qrCodeCopiaECola && !expirado) {
      navigator.clipboard.writeText(pixData.qrCodeCopiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 px-4 py-12 font-sans">
      <div className="bg-white p-8 md:p-12 rounded-lg shadow-sm text-center max-w-xl w-full border border-gray-100">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-serif text-gray-900 mb-2">
          Pedido Reservado!
        </h1>
        <p className="text-gray-500 mb-8">
          Falta pouco. Escaneie o QR Code abaixo ou utilize a opção Pix Copia e
          Cola no aplicativo do seu banco para confirmar a compra.
        </p>

        {pixData ? (
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 mb-8 relative overflow-hidden">
            {/* Aviso de Tempo */}
            <div
              className={`py-2 px-4 mb-6 rounded text-sm font-bold flex items-center justify-center gap-2 ${expirado ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-800"}`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {expirado
                ? "Este código PIX expirou."
                : `Pague em até ${tempoRestante}`}
            </div>

            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm mb-4">
              Pague com QR Code
            </h3>

            <div
              className={`bg-white p-2 rounded-lg inline-block border border-gray-200 mb-6 transition-opacity ${expirado ? "opacity-30" : "opacity-100"}`}
            >
              <img
                src={pixData.qrCodeImagem}
                alt="QR Code do PIX"
                className="w-48 h-48 object-contain"
              />
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm">
                Ou Pix Copia e Cola
              </h3>
              <input
                type="text"
                readOnly
                value={pixData.qrCodeCopiaECola}
                className={`w-full bg-white border border-gray-300 text-gray-500 text-xs py-3 px-4 rounded focus:outline-none ${expirado ? "bg-gray-100" : ""}`}
              />
              <button
                onClick={handleCopiarPix}
                disabled={expirado}
                className="w-full bg-stone-900 text-white py-3 text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {expirado
                  ? "Código Expirado"
                  : copiado
                    ? "Código Copiado!"
                    : "Copiar Código Pix"}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-10 text-gray-400 text-sm tracking-widest uppercase">
            Carregando informações de pagamento...
          </div>
        )}

        <Link
          href="/"
          className="text-sm font-bold text-gray-500 hover:text-black border-b border-transparent hover:border-black transition-all pb-1"
        >
          Voltar para a Loja
        </Link>
      </div>
    </div>
  );
}
