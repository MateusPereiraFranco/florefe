"use server";

import { supabaseAdmin } from "../../lib/supabase";

// 1. Barreira de Segurança
export async function validarSenhaAdmin(senhaDigitada: string) {
  const senhaReal = process.env.ADMIN_PASSWORD;
  if (!senhaReal) return false;
  return senhaDigitada === senhaReal;
}

// 2. Busca e Filtro de Pedidos (Agora traz todos os status)
export async function buscarPedidosAdmin(
  dataInicio?: string,
  dataFim?: string,
) {
  if (!supabaseAdmin) throw new Error("Supabase Admin não inicializado.");

  try {
    let query = supabaseAdmin
      .from("pedidos")
      .select(
        `
        *,
        clientes (nome, sobrenome, email)
      `,
      )
      .order("criado_em", { ascending: false });

    // Filtro de datas
    if (dataInicio && dataFim) {
      query = query
        .gte("criado_em", `${dataInicio}T00:00:00.000Z`)
        .lte("criado_em", `${dataFim}T23:59:59.999Z`);
    }

    const { data: pedidos, error } = await query;

    if (error) throw new Error(error.message);

    // O Faturamento continua somando APENAS o que de fato entrou no caixa
    const faturamentoTotal = pedidos
      .filter((p: any) => ["pago", "enviado", "entregue"].includes(p.status))
      .reduce((soma: number, pedido: any) => soma + Number(pedido.total), 0);

    return { sucesso: true, pedidos, faturamentoTotal };
  } catch (error) {
    console.error("Erro no Admin:", error);
    return { sucesso: false, erro: "Falha ao buscar pedidos." };
  }
}

// 3. Atualizar Status Logístico
export async function atualizarStatusPedido(
  pedidoId: string,
  novoStatus: "enviado" | "entregue" | "cancelado",
) {
  if (!supabaseAdmin) return { sucesso: false };

  const { error } = await supabaseAdmin
    .from("pedidos")
    .update({ status: novoStatus })
    .eq("id", pedidoId);

  if (error) return { sucesso: false, erro: error.message };
  return { sucesso: true };
}
// =========================================================================
// MÓDULO DE PRODUTOS (ADMIN)
// =========================================================================

// 1. Buscar todos os produtos (ativos e inativos)
export async function buscarTodosProdutosAdmin() {
  if (!supabaseAdmin) throw new Error("Supabase Admin não inicializado.");
  try {
    const { data: produtos, error } = await supabaseAdmin
      .from("produtos")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) throw new Error(error.message);
    return { sucesso: true, produtos };
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return { sucesso: false, erro: "Falha ao buscar produtos." };
  }
}

export async function uploadImagemProduto(formData: FormData) {
  if (!supabaseAdmin)
    return { sucesso: false, erro: "Erro de conexão com o banco." };

  try {
    const file = formData.get("imagem") as File;
    if (!file) return { sucesso: false, erro: "Nenhum arquivo enviado." };

    // Cria um nome único (ex: 1698765432-foto.jpg) para não sobrescrever imagens com nomes iguais
    const extensao = file.name.split(".").pop();
    const nomeUnico = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${extensao}`;

    // Faz o upload direto para o Supabase
    const { error } = await supabaseAdmin.storage
      .from("produtos")
      .upload(nomeUnico, file, {
        cacheControl: "3600",
        upsert: false, // Não substitui, sempre cria um novo
      });

    if (error) throw new Error(error.message);

    // Pega a URL pública final para salvarmos no banco de dados
    const { data } = supabaseAdmin.storage
      .from("produtos")
      .getPublicUrl(nomeUnico);

    return { sucesso: true, url: data.publicUrl };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
}

// 2. Adicionar Novo Produto
export async function adicionarProdutoAdmin(produto: {
  nome: string;
  marca: string;
  preco: number;
  preco_antigo: number | null;
  categoria: string;
  descricao: string;
  imagem_url: string;
}) {
  if (!supabaseAdmin)
    return { sucesso: false, erro: "Erro de conexão com o banco." };
  try {
    const { error } = await supabaseAdmin.from("produtos").insert([
      {
        nome: produto.nome,
        marca: produto.marca,
        preco: produto.preco,
        preco_antigo: produto.preco_antigo,
        categoria: produto.categoria,
        descricao: produto.descricao,
        imagem_url: produto.imagem_url,
        ativo: true,
        em_estoque: true,
      },
    ]);

    if (error) throw new Error(error.message);
    return { sucesso: true };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
}

// 3. Ocultar ou Exibir Produto (Ligar/Desligar)
export async function alternarVisibilidadeProduto(
  produtoId: string,
  statusAtual: boolean,
) {
  if (!supabaseAdmin)
    return { sucesso: false, erro: "Erro de conexão com o banco." };
  try {
    const { error } = await supabaseAdmin
      .from("produtos")
      .update({ ativo: !statusAtual }) // Inverte o status atual
      .eq("id", produtoId);

    if (error) throw new Error(error.message);
    return { sucesso: true };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
}

// 4. Editar Produto Existente
export async function editarProdutoAdmin(
  id: string,
  produto: {
    nome: string;
    marca: string;
    preco: number;
    preco_antigo: number | null;
    categoria: string;
    descricao: string;
    imagem_url: string;
  },
) {
  if (!supabaseAdmin)
    return { sucesso: false, erro: "Erro de conexão com o banco." };
  try {
    const { error } = await supabaseAdmin
      .from("produtos")
      .update({
        nome: produto.nome,
        marca: produto.marca,
        preco: produto.preco,
        preco_antigo: produto.preco_antigo,
        categoria: produto.categoria,
        descricao: produto.descricao,
        imagem_url: produto.imagem_url,
      })
      .eq("id", id);

    if (error) throw new Error(error.message);
    return { sucesso: true };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
}
