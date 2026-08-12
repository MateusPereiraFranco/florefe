"use client";

import React, { useState } from "react";
import { buscarPedidosPorEmail } from "../actions/pedidos";

export default function PedidosPage() {
  const [email, setEmail] = useState("");
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  // Estado para mostrar o PIX do pedido selecionado
  const [pixAberto, setPixAberto] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuscando(true);
    setMensagem("");
    setPixAberto(null);

    const resultado = await buscarPedidosPorEmail(email);

    if (resultado.sucesso && resultado.pedidos) {
      setPedidos(resultado.pedidos);
    } else {
      setPedidos([]);
      setMensagem(resultado.erro || "Erro desconhecido.");
    }
    setBuscando(false);
  };

  const handleCopiar = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const verificarSeExpirou = (dataExpiracao: string) => {
    return new Date(dataExpiracao).getTime() < new Date().getTime();
  };

  return (
    <div className="min-h-[70vh] bg-gray-50 py-12 font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8 uppercase tracking-widest text-center">
          Meus Pedidos
        </h1>

        {/* Formulário de Busca */}
        <form
          onSubmit={handleBuscar}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex gap-4 mb-10"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite o e-mail usado na compra"
            required
            className="flex-grow border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors"
          />
          <button
            type="submit"
            disabled={buscando}
            className="bg-stone-900 text-white px-8 py-2 text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50"
          >
            {buscando ? "Buscando..." : "Acessar"}
          </button>
        </form>

        {mensagem && (
          <p className="text-red-500 text-sm text-center mb-6">{mensagem}</p>
        )}

        {/* Lista de Pedidos */}
        <div className="space-y-6">
          {pedidos.map((pedido) => {
            const expirou = verificarSeExpirou(pedido.pix_expiracao);
            const mostrarPix = pixAberto === pedido.id;

            return (
              <div
                key={pedido.id}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest">
                      Pedido #{pedido.id.substring(0, 8)}
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      Realizado em{" "}
                      {new Date(pedido.criado_em).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-black">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(pedido.total)}
                    </p>
                    <span
                      className={`inline-block mt-1 px-2 py-1 text-[10px] uppercase font-bold rounded ${
                        pedido.status === "pendente"
                          ? "bg-yellow-100 text-yellow-800"
                          : pedido.status === "pago"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {pedido.status}
                    </span>
                  </div>
                </div>

                {/* Se o pedido estiver pendente e o PIX não expirou, mostra o botão de Pagar */}
                {pedido.status === "pendente" && !expirou && !mostrarPix && (
                  <button
                    onClick={() => setPixAberto(pedido.id)}
                    className="w-full bg-stone-100 text-stone-900 py-3 text-sm font-bold uppercase tracking-widest hover:bg-stone-200 transition-colors"
                  >
                    Visualizar PIX para Pagamento
                  </button>
                )}

                {/* Se o botão for clicado, renderiza o PIX */}
                {mostrarPix && (
                  <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 mt-4 text-center">
                    <h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm mb-4">
                      Pague com QR Code
                    </h3>
                    <div className="bg-white p-2 rounded-lg inline-block border border-gray-200 mb-6">
                      <img
                        src={pedido.pix_imagem}
                        alt="QR Code"
                        className="w-32 h-32 object-contain"
                      />
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={pedido.pix_copia_e_cola}
                      className="w-full bg-white border border-gray-300 text-gray-500 text-xs py-2 px-3 rounded focus:outline-none mb-3"
                    />
                    <button
                      onClick={() => handleCopiar(pedido.pix_copia_e_cola)}
                      className="w-full bg-stone-900 text-white py-3 text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors"
                    >
                      {copiado ? "Código Copiado!" : "Copiar Código Pix"}
                    </button>
                    <button
                      onClick={() => setPixAberto(null)}
                      className="mt-4 text-xs text-gray-500 underline"
                    >
                      Fechar
                    </button>
                  </div>
                )}

                {pedido.status === "pendente" && expirou && (
                  <p className="text-xs text-red-500 text-center mt-2">
                    O prazo de pagamento deste PIX expirou. Faça um novo pedido.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
