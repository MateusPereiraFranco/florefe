"use server";

import { supabaseAdmin } from '../../lib/supabase';

// 1. Barreira de Segurança
export async function validarSenhaAdmin(senhaDigitada: string) {
  const senhaReal = process.env.ADMIN_PASSWORD;
  if (!senhaReal) return false;
  return senhaDigitada === senhaReal;
}

// 2. Busca e Filtro de Pedidos (Agora traz todos os status)
export async function buscarPedidosAdmin(dataInicio?: string, dataFim?: string) {
  if (!supabaseAdmin) throw new Error('Supabase Admin não inicializado.');

  try {
    // Agora buscamos TODOS os pedidos sem restringir o status
    let query = supabaseAdmin
      .from('pedidos')
      .select(`
        *,
        clientes (nome, sobrenome, email)
      `)
      .order('created_at', { ascending: false });

    // Filtro de datas
    if (dataInicio && dataFim) {
      query = query
        .gte('created_at', `${dataInicio}T00:00:00.000Z`)
        .lte('created_at', `${dataFim}T23:59:59.999Z`);
    }

    const { data: pedidos, error } = await query;

    if (error) throw new Error(error.message);

    // O Faturamento continua somando APENAS o que de fato entrou no caixa
    const faturamentoTotal = pedidos
      .filter((p: any) => ['pago', 'enviado', 'entregue'].includes(p.status))
      .reduce((soma: number, pedido: any) => soma + Number(pedido.total), 0);

    return { sucesso: true, pedidos, faturamentoTotal };
  } catch (error) {
    console.error("Erro no Admin:", error);
    return { sucesso: false, erro: 'Falha ao buscar pedidos.' };
  }
}

// 3. Atualizar Status Logístico
export async function atualizarStatusPedido(pedidoId: string, novoStatus: 'enviado' | 'entregue' | 'cancelado') {
  if (!supabaseAdmin) return { sucesso: false };

  const { error } = await supabaseAdmin
    .from('pedidos')
    .update({ status: novoStatus })
    .eq('id', pedidoId);

  if (error) return { sucesso: false, erro: error.message };
  return { sucesso: true };
}
// =========================================================================
// MÓDULO DE PRODUTOS (ADMIN)
// =========================================================================

// 1. Buscar todos os produtos (ativos e inativos)
export async function buscarTodosProdutosAdmin() {
  if (!supabaseAdmin) throw new Error('Supabase Admin não inicializado.');
  try {
    const { data: produtos, error } = await supabaseAdmin
      .from('produtos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return { sucesso: true, produtos };
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return { sucesso: false, erro: 'Falha ao buscar produtos.' };
  }
}

// 2. Adicionar Novo Produto
export async function adicionarProdutoAdmin(produto: { nome: string, preco: number, tamanho: string, imagem: string }) {
  if (!supabaseAdmin) return { sucesso: false, erro: 'Erro de conexão com o banco.' };
  try {
    const { error } = await supabaseAdmin.from('produtos').insert([{
      nome: produto.nome,
      preco: produto.preco,
      tamanho: produto.tamanho,
      imagem: produto.imagem,
      ativo: true // Já nasce visível
    }]);

    if (error) throw new Error(error.message);
    return { sucesso: true };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
}

// 3. Ocultar ou Exibir Produto (Ligar/Desligar)
export async function alternarVisibilidadeProduto(produtoId: string, statusAtual: boolean) {
  if (!supabaseAdmin) return { sucesso: false, erro: 'Erro de conexão com o banco.' };
  try {
    const { error } = await supabaseAdmin
      .from('produtos')
      .update({ ativo: !statusAtual }) // Inverte o status atual
      .eq('id', produtoId);

    if (error) throw new Error(error.message);
    return { sucesso: true };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
}