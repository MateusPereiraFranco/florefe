"use server";

import { supabaseAdmin } from "../../lib/supabase";
import { MercadoPagoConfig, Payment } from "mercadopago";

export async function processarCheckout(dados: any) {
  if (!supabaseAdmin)
    throw new Error("Erro crítico: Supabase Admin não inicializado.");

  const { cliente, endereco, carrinho, total, metodoPagamento, dadosCartao } =
    dados;

  try {
    // 1. BUSCAR OU CRIAR CLIENTE
    let clienteId;
    const { data: clienteExistente } = await supabaseAdmin
      .from("clientes")
      .select("id")
      .eq("email", cliente.email)
      .limit(1);

    if (clienteExistente && clienteExistente.length > 0) {
      clienteId = clienteExistente[0].id;
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

    // 2. CRIAR O PEDIDO NO BANCO (Status inicial: pendente)
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
          status: "pendente",
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

    await supabaseAdmin.from("itens_pedido").insert(itensParaInserir);

    // -----------------------------------------------------------
    // 4. INTEGRAÇÃO MERCADO PAGO - CARTÃO OU PIX
    // -----------------------------------------------------------
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
    });
    const payment = new Payment(client);

    // ------------------ FLUXO DO CARTÃO ------------------
    if (metodoPagamento === "cartao") {
      // O formulário do front-end já envia os dados no formato perfeito exigido pelo Mercado Pago
      const pagamentoCartao = await payment.create({
        body: {
          ...dadosCartao, // Aqui vem o Token do cartão, parcelas, bandeira e CPF do titular
          transaction_amount: Number(total.toFixed(2)),
          description: `Pedido Flores e Fé #${pedido.id.substring(0, 6)}`,
          external_reference: pedido.id,
        },
      });

      // Se o cartão for recusado (ex: sem limite), barramos aqui
      if (pagamentoCartao.status === "rejected") {
        // Marcamos como cancelado no banco
        await supabaseAdmin
          .from("pedidos")
          .update({ status: "cancelado" })
          .eq("id", pedido.id);
        return {
          sucesso: false,
          erro: "O pagamento foi recusado pelo emissor do cartão. Verifique os dados ou o limite.",
        };
      }

      // Se aprovou, já atualizamos o banco imediatamente
      if (pagamentoCartao.status === "approved") {
        await supabaseAdmin
          .from("pedidos")
          .update({ status: "pago" })
          .eq("id", pedido.id);
      }

      return {
        sucesso: true,
        pedidoId: pedido.id,
        metodo: "cartao",
        status_pagamento: pagamentoCartao.status, // Pode ser 'approved' ou 'in_process' (em análise)
      };
    }
    // ------------------ FLUXO DO PIX ------------------
    else {
      const dataExpiracao = new Date();
      dataExpiracao.setMinutes(dataExpiracao.getMinutes() + 30);
      const dataExpiracaoISO = dataExpiracao.toISOString();

      const pixData = await payment.create({
        body: {
          transaction_amount: Number(total.toFixed(2)),
          description: `Pedido Flores e Fé #${pedido.id.substring(0, 6)}`,
          payment_method_id: "pix",
          date_of_expiration: dataExpiracaoISO,
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
        metodo: "pix",
        pix: {
          qrCodeCopiaECola: qrCode,
          qrCodeImagem: pixImagemCerta,
          expiracao: dataExpiracaoISO,
        },
      };
    }
  } catch (error) {
    console.error("Falha no processamento:", error);
    return {
      sucesso: false,
      erro: "Falha ao processar o pagamento. Tente novamente.",
    };
  }
}
