"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  validarSenhaAdmin,
  buscarPedidosAdmin,
  atualizarStatusPedido,
} from "../actions/admin";
import Link from "next/link"; // <-- Link importado aqui!

export default function AdminDashboardPage() {
  // Controle de Acesso
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");
  const [erroLogin, setErroLogin] = useState("");

  // Dados
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [faturamento, setFaturamento] = useState(0);
  const [carregando, setCarregando] = useState(false);

  // Filtros
  const [abaAtiva, setAbaAtiva] = useState<
    "todos" | "pendente" | "pago" | "falta_entregar" | "entregue"
  >("todos");

  // AQUI ESTÃO AS VARIÁVEIS QUE O TS RECLAMOU QUE FALTAVAM:
  const hoje = new Date().toISOString().split("T")[0];
  const trintaDiasAtras = new Date(
    new Date().setDate(new Date().getDate() - 30),
  )
    .toISOString()
    .split("T")[0];
  const [dataInicio, setDataInicio] = useState(trintaDiasAtras);
  const [dataFim, setDataFim] = useState(hoje);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const acessoPermitido = await validarSenhaAdmin(senha);
    if (acessoPermitido) {
      setAutenticado(true);
      carregarDados(dataInicio, dataFim);
    } else {
      setErroLogin("Senha incorreta. Acesso negado.");
    }
  };

  // E AQUI ESTÁ A FUNÇÃO carregarDados:
  const carregarDados = async (inicio: string, fim: string) => {
    setCarregando(true);
    const resultado = await buscarPedidosAdmin(inicio, fim);
    if (resultado.sucesso) {
      setPedidos(resultado.pedidos || []);
      setFaturamento(resultado.faturamentoTotal || 0);
    }
    setCarregando(false);
  };

  const handleMudarStatus = async (
    pedidoId: string,
    novoStatus: "enviado" | "entregue" | "cancelado",
  ) => {
    const confirmacao = confirm(
      `Tem certeza que deseja marcar este pedido como ${novoStatus.toUpperCase()}?`,
    );
    if (!confirmacao) return;

    setCarregando(true);
    const resultado = await atualizarStatusPedido(pedidoId, novoStatus);
    if (resultado.sucesso) {
      await carregarDados(dataInicio, dataFim);
    } else {
      alert("Erro ao atualizar status.");
    }
    setCarregando(false);
  };

  const qtdPendentes = pedidos.filter((p) => p.status === "pendente").length;
  const qtdPagos = pedidos.filter((p) => p.status === "pago").length;
  const qtdFaltaEntregar = pedidos.filter(
    (p) => p.status === "pago" || p.status === "enviado",
  ).length;

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((pedido) => {
      if (abaAtiva === "todos") return true;
      if (abaAtiva === "pendente") return pedido.status === "pendente";
      if (abaAtiva === "pago") return pedido.status === "pago";
      if (abaAtiva === "falta_entregar")
        return pedido.status === "pago" || pedido.status === "enviado";
      if (abaAtiva === "entregue") return pedido.status === "entregue";
      return true;
    });
  }, [pedidos, abaAtiva]);

  // TELA DE LOGIN
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center font-sans">
        <div className="bg-white p-8 rounded shadow-xl max-w-sm w-full">
          <h1 className="text-xl font-bold uppercase tracking-widest text-center mb-6">
            Acesso Restrito
          </h1>
          {erroLogin && (
            <p className="text-red-500 text-xs font-bold text-center mb-4">
              {erroLogin}
            </p>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Digite a senha mestra"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-stone-900 text-center tracking-widest"
            />
            <button
              type="submit"
              className="w-full bg-stone-900 text-white py-3 uppercase tracking-widest text-sm font-bold hover:bg-black"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // TELA DO PAINEL
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* CABEÇALHO COM O BOTÃO DE ESTOQUE NOVO */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-6 rounded shadow-sm border border-gray-100 gap-4">
          <div className="flex flex-col items-start gap-3">
            <h1 className="text-2xl font-serif font-bold uppercase tracking-widest">
              Painel de Operações
            </h1>

            <Link
              href="/painel-floresefe-secreto/produtos"
              className="bg-stone-100 text-stone-700 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded hover:bg-stone-200 transition flex items-center gap-2 border border-stone-200"
            >
              <svg
                className="w-4 h-4 text-stone-500"
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
              Gerenciar Estoque e Produtos
            </Link>
          </div>

          <div className="flex items-end gap-4 mt-2 xl:mt-0">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Início
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="border p-2 rounded text-sm focus:outline-none"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Fim
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="border p-2 rounded text-sm focus:outline-none"
              />
            </div>
            <button
              onClick={() => carregarDados(dataInicio, dataFim)}
              className="bg-stone-900 text-white px-4 py-2 text-sm font-bold uppercase tracking-widest rounded hover:bg-black transition-colors"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-stone-900 text-white p-6 rounded shadow-sm flex flex-col items-center justify-center text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">
              Caixa (R$)
            </h2>
            <span className="text-2xl font-serif">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(faturamento)}
            </span>
          </div>
          <div className="bg-orange-50 border border-orange-100 p-6 rounded shadow-sm flex flex-col items-center justify-center text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-1">
              Aguard. Pagamento
            </h2>
            <span className="text-3xl font-serif text-orange-600">
              {qtdPendentes}
            </span>
          </div>
          <div className="bg-blue-50 border border-blue-100 p-6 rounded shadow-sm flex flex-col items-center justify-center text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">
              Pagos (Sem envio)
            </h2>
            <span className="text-3xl font-serif text-blue-600">
              {qtdPagos}
            </span>
          </div>
          <div className="bg-red-50 border border-red-100 p-6 rounded shadow-sm flex flex-col items-center justify-center text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">
              Faltam Entregar
            </h2>
            <span className="text-3xl font-serif text-red-600">
              {qtdFaltaEntregar}
            </span>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex overflow-x-auto gap-2 bg-white p-2 rounded border border-gray-100 shadow-sm">
          <button
            onClick={() => setAbaAtiva("todos")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded whitespace-nowrap transition-colors ${abaAtiva === "todos" ? "bg-stone-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}
          >
            Todos
          </button>
          <button
            onClick={() => setAbaAtiva("pendente")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded whitespace-nowrap transition-colors ${abaAtiva === "pendente" ? "bg-orange-100 text-orange-800" : "text-gray-500 hover:bg-gray-100"}`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setAbaAtiva("pago")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded whitespace-nowrap transition-colors ${abaAtiva === "pago" ? "bg-blue-100 text-blue-800" : "text-gray-500 hover:bg-gray-100"}`}
          >
            Apenas Pagos
          </button>
          <button
            onClick={() => setAbaAtiva("falta_entregar")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded whitespace-nowrap transition-colors ${abaAtiva === "falta_entregar" ? "bg-red-100 text-red-800" : "text-gray-500 hover:bg-gray-100"}`}
          >
            Faltam Entregar
          </button>
          <button
            onClick={() => setAbaAtiva("entregue")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded whitespace-nowrap transition-colors ${abaAtiva === "entregue" ? "bg-green-100 text-green-800" : "text-gray-500 hover:bg-gray-100"}`}
          >
            Finalizados
          </button>
        </div>

        {/* TABELA DE PEDIDOS */}
        <div className="bg-white rounded shadow-sm border border-gray-100 overflow-x-auto">
          {carregando ? (
            <div className="p-12 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">
              Atualizando dados...
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-stone-100 text-stone-600 text-xs uppercase tracking-widest">
                  <th className="p-4 border-b">Data</th>
                  <th className="p-4 border-b">Cliente</th>
                  <th className="p-4 border-b">Endereço</th>
                  <th className="p-4 border-b">Valor</th>
                  <th className="p-4 border-b">Status</th>
                  <th className="p-4 border-b text-right">Ação Logística</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-gray-500 font-medium"
                    >
                      Nenhum pedido encontrado nesta aba.
                    </td>
                  </tr>
                ) : (
                  pedidosFiltrados.map((pedido) => (
                    <tr
                      key={pedido.id}
                      className="hover:bg-gray-50 transition-colors border-b last:border-0"
                    >
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(pedido.criado_em).toLocaleDateString("pt-BR")}{" "}
                        <br />
                        <span className="text-xs text-gray-400">
                          {new Date(pedido.criado_em).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold text-gray-900">
                        {pedido.clientes?.nome} {pedido.clientes?.sobrenome}
                        <br />
                        <span className="text-xs text-gray-500 font-normal">
                          {pedido.clientes?.email}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-600 max-w-xs">
                        {pedido.endereco_logradouro}, {pedido.endereco_numero}{" "}
                        <br />
                        {pedido.endereco_bairro} - {pedido.endereco_cidade}/
                        {pedido.endereco_estado}
                      </td>
                      <td className="p-4 text-sm font-bold text-gray-900">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(pedido.total)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${
                            pedido.status === "pago"
                              ? "bg-blue-100 text-blue-800"
                              : pedido.status === "pendente"
                                ? "bg-orange-100 text-orange-800"
                                : pedido.status === "cancelado"
                                  ? "bg-red-100 text-red-800"
                                  : pedido.status === "enviado"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-green-100 text-green-800"
                          }`}
                        >
                          {pedido.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-y-2">
                        {pedido.status === "pendente" && (
                          <button
                            onClick={() =>
                              handleMudarStatus(pedido.id, "cancelado")
                            }
                            className="block w-full text-center border border-red-200 text-red-600 text-[10px] font-bold uppercase py-2 px-3 rounded hover:bg-red-50 transition"
                          >
                            Cancelar Pedido
                          </button>
                        )}
                        {pedido.status === "pago" && (
                          <>
                            <button
                              onClick={() =>
                                handleMudarStatus(pedido.id, "enviado")
                              }
                              className="block w-full text-center bg-stone-900 text-white text-[10px] font-bold uppercase py-2 px-3 rounded hover:bg-black transition"
                            >
                              Despachar
                            </button>
                            <button
                              onClick={() =>
                                handleMudarStatus(pedido.id, "entregue")
                              }
                              className="block w-full text-center bg-green-600 text-white text-[10px] font-bold uppercase py-2 px-3 rounded hover:bg-green-700 transition"
                            >
                              Entregue Direto
                            </button>
                          </>
                        )}
                        {pedido.status === "enviado" && (
                          <button
                            onClick={() =>
                              handleMudarStatus(pedido.id, "entregue")
                            }
                            className="block w-full text-center bg-green-600 text-white text-[10px] font-bold uppercase py-2 px-3 rounded hover:bg-green-700 transition"
                          >
                            Marcar Entregue
                          </button>
                        )}
                        {(pedido.status === "entregue" ||
                          pedido.status === "cancelado") && (
                          <span className="text-xs text-gray-400 font-bold uppercase">
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
