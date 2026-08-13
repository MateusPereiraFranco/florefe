"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function SucessoPage() {
  const [pixData, setPixData] = useState<any>(null);
  const [copiado, setCopiado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Busca os dados do PIX no armazenamento local
    const dados = localStorage.getItem("@FloresEFe:pix");
    if (dados) {
      setPixData(JSON.parse(dados));
    }
    setCarregando(false);
  }, []);

  const handleCopiar = () => {
    if (pixData?.qrCodeCopiaECola) {
      navigator.clipboard.writeText(pixData.qrCodeCopiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        {pixData ? (
          /* ==============================================================
             CENÁRIO 1: PAGAMENTO VIA PIX (Aguardando Pagamento)
             ============================================================== */
          <div className="animate-fadeIn">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>

            <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2 uppercase tracking-widest">
              Pedido Reservado!
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              Falta pouco! Pague o PIX abaixo para garantir seus produtos.
            </p>

            <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 mb-6">
              <img
                src={pixData.qrCodeImagem}
                alt="QR Code PIX"
                className="w-48 h-48 mx-auto mix-blend-multiply"
              />
            </div>

            <div className="mb-8">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Código Copia e Cola
              </p>
              <input
                type="text"
                readOnly
                value={pixData.qrCodeCopiaECola}
                className="w-full bg-gray-50 border border-gray-200 text-gray-500 text-xs py-3 px-3 rounded focus:outline-none mb-3 text-center"
              />
              <button
                onClick={handleCopiar}
                className="w-full bg-stone-900 text-white py-4 text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors"
              >
                {copiado ? "Código Copiado!" : "Copiar Código Pix"}
              </button>
            </div>
          </div>
        ) : (
          /* ==============================================================
             CENÁRIO 2: PAGAMENTO VIA CARTÃO DE CRÉDITO (Aprovado na hora)
             ============================================================== */
          <div className="animate-fadeIn">
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
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>

            <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2 uppercase tracking-widest">
              Pedido Confirmado!
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              O pagamento foi aprovado com sucesso. Seu pedido já está sendo
              preparado.
            </p>

            <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 mb-8 text-left space-y-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-stone-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  ></path>
                </svg>
                <p className="text-sm text-stone-600">
                  Enviamos um e-mail com o recibo e os detalhes da sua compra.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-stone-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  ></path>
                </svg>
                <p className="text-sm text-stone-600">
                  Você pode acompanhar o status da entrega na área{" "}
                  <strong>Meus Pedidos</strong> no menu principal.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* BOTÃO COMPARTILHADO (Aparece nos dois cenários) */}
        <Link
          href="/"
          className={`block w-full py-4 text-sm font-bold uppercase tracking-widest transition-colors ${pixData ? "bg-transparent text-stone-500 border border-stone-300 hover:bg-stone-50" : "bg-stone-900 text-white hover:bg-black"}`}
        >
          Voltar para a Loja
        </Link>
        <div className="mt-4">
          <Link
            href="/pedidos"
            className="text-xs text-stone-500 underline hover:text-stone-900"
          >
            Acompanhar Meus Pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}
