"use server";

import { supabaseAdmin } from "../../lib/supabase";
// Importando as classes oficiais do Mercado Pago
import { MercadoPagoConfig, Payment } from "mercadopago";

export async function processarCheckout(dados: any) {
  if (!supabaseAdmin) {
    throw new Error("Erro crítico: Supabase Admin não inicializado.");
  }

  const { cliente, endereco, carrinho, total } = dados;

  try {
    // 1. BUSCAR OU CRIAR CLIENTE (O mesmo código seguro de antes)
    let clienteId;
    const { data: clienteExistente } = await supabaseAdmin
      .from("clientes")
      .select("id")
      .eq("email", cliente.email)
      .single();

    if (clienteExistente) {
      clienteId = clienteExistente.id;
    } else {
      const { data: novoCliente, error: erroCliente } = await supabaseAdmin
        .from("clientes")
        .insert([
          {
            email: cliente.email,
            nome: cliente.nome,
            sobrenome: cliente.sobrenome,
          },
        ])
        .select()
        .single();
      if (erroCliente) throw new Error("Erro ao cadastrar cliente.");
      clienteId = novoCliente.id;
    }

    // 2. CRIAR O PEDIDO NO BANCO
    const { data: pedido, error: erroPedido } = await supabaseAdmin
      .from("pedidos")
      .insert([
        {
          cliente_id: clienteId,
          total: total,
          endereco_cep: endereco.cep,
          endereco_logradouro: endereco.logradouro,
          endereco_numero: endereco.numero,
          endereco_bairro: endereco.bairro,
          endereco_cidade: endereco.cidade,
          endereco_estado: endereco.estado,
          endereco_complemento: endereco.complemento,
          status: "pendente", // Fica pendente até o cliente pagar o PIX
        },
      ])
      .select()
      .single();

    if (erroPedido) throw new Error("Erro ao gerar pedido no banco.");

    // 3. INSERIR OS ITENS DO CARRINHO
    const itensParaInserir = carrinho.map((item: any) => ({
      pedido_id: pedido.id,
      produto_id: item.id,
      quantidade: item.quantidade,
      preco_unitario: item.preco,
    }));

    const { error: erroItens } = await supabaseAdmin
      .from("itens_pedido")
      .insert(itensParaInserir);

    if (erroItens) throw new Error("Erro ao salvar os itens.");

    // -----------------------------------------------------------
    // 4. INTEGRAÇÃO MERCADO PAGO - GERAÇÃO DO PIX
    // -----------------------------------------------------------

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
    });
    const payment = new Payment(client);

    // Cria a data atual e adiciona 30 minutos
    const dataExpiracao = new Date();
    dataExpiracao.setMinutes(dataExpiracao.getMinutes() + 30);
    // O Mercado Pago exige o formato ISO com o fuso horário correto (vamos usar o UTC-03:00)
    // Para simplificar no código, passamos o timezone exato da string ISO do JS
    const dataExpiracaoISO = dataExpiracao.toISOString();

    const pixData = await payment.create({
      body: {
        transaction_amount: Number(total.toFixed(2)),
        description: `Pedido Flores e Fé #${pedido.id.substring(0, 6)}`,
        payment_method_id: "pix",
        date_of_expiration: dataExpiracaoISO, // <--- ADICIONAMOS A VALIDADE AQUI
        external_reference: pedido.id,
        payer: {
          email: cliente.email,
          first_name: cliente.nome,
          last_name: cliente.sobrenome,
        },
      },
    });

    const qrCode = pixData.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 =
      pixData.point_of_interaction?.transaction_data?.qr_code_base64;

    if (!qrCode || !qrCodeBase64) {
      throw new Error("Mercado Pago não retornou os dados do PIX.");
    }

    const pixImagemCerta = `data:image/jpeg;base64,${qrCodeBase64}`;

    // NOVO: Atualiza o pedido no banco salvando as informações do PIX gerado!
    await supabaseAdmin
      .from("pedidos")
      .update({
        pix_copia_e_cola: qrCode,
        pix_imagem: pixImagemCerta,
        pix_expiracao: dataExpiracaoISO,
      })
      .eq("id", pedido.id);

    return {
      sucesso: true,
      pedidoId: pedido.id,
      pix: {
        qrCodeCopiaECola: qrCode,
        qrCodeImagem: pixImagemCerta,
        expiracao: dataExpiracaoISO,
      },
    };
  } catch (error) {
    console.error("Falha no processamento:", error);
    return {
      sucesso: false,
      erro: "Falha interna ao processar o pedido e pagamento.",
    };
  }
}
