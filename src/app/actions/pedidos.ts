"use server";

import { supabaseAdmin } from "../../lib/supabase";

export async function buscarPedidosPorEmail(email: string) {
  if (!supabaseAdmin) {
    return {
      sucesso: false,
      erro: "Erro crítico: Supabase Admin não inicializado.",
    };
  }

  try {
    // 1. Acha o cliente pelo e-mail usando limit(1) em vez de single()
    // Isso evita que o banco trave caso você tenha testado o mesmo e-mail várias vezes
    const { data: clientes, error: erroCliente } = await supabaseAdmin
      .from("clientes")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (erroCliente) {
      console.error("Erro no Supabase ao buscar cliente:", erroCliente);
      return { sucesso: false, erro: "Falha ao buscar os dados do cliente." };
    }

    if (!clientes || clientes.length === 0) {
      return {
        sucesso: false,
        erro: "Nenhum pedido encontrado para este e-mail.",
      };
    }

    const clienteId = clientes[0].id;

    // 2. Busca todos os pedidos desse cliente
    const { data: pedidos, error: erroPedidos } = await supabaseAdmin
      .from("pedidos")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("criado_em", { ascending: false });

    if (erroPedidos) {
      console.error("Erro no Supabase ao buscar pedidos:", erroPedidos);
      return {
        sucesso: false,
        erro: "Falha ao buscar o histórico de pedidos.",
      };
    }

    return { sucesso: true, pedidos };
  } catch (error) {
    console.error("Erro interno na action de pedidos:", error);
    return {
      sucesso: false,
      erro: "Ocorreu um erro interno ao processar sua busca.",
    };
  }
}
