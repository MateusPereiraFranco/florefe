import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { supabaseAdmin } from "../../../../lib/supabase";
import { Resend } from "resend";

// Inicializa o Resend com a sua chave secreta
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const paymentId = body?.data?.id || body?.id;

    if (!paymentId) {
      return NextResponse.json(
        { message: "Nenhum ID de pagamento" },
        { status: 200 },
      );
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
    });
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: paymentId });

    if (paymentData.status === "approved") {
      const pedidoId = paymentData.external_reference;

      if (pedidoId && supabaseAdmin) {
        // 1. Atualiza o status do pedido para 'pago'
        const { error } = await supabaseAdmin
          .from("pedidos")
          .update({ status: "pago" })
          .eq("id", pedidoId);

        if (error) {
          console.error("Erro ao atualizar pedido:", error);
          return NextResponse.json({ error: "Erro no banco" }, { status: 500 });
        }

        console.log(`Sucesso! Pedido ${pedidoId} marcado como PAGO.`);

        // 2. Busca os dados do cliente e do pedido para montar o e-mail
        const { data: pedidoComCliente } = await supabaseAdmin
          .from("pedidos")
          .select("*, clientes(email, nome)")
          .eq("id", pedidoId)
          .single();

        // 3. Dispara o E-mail via Resend
        if (pedidoComCliente && pedidoComCliente.clientes) {
          try {
            await resend.emails.send({
              from: "Flores e Fé <onboarding@resend.dev>", // E-mail de teste exigido pelo Resend
              to: pedidoComCliente.clientes.email, // ATENÇÃO: Nos testes, isso DEVE ser o seu e-mail cadastrado no Resend
              subject: "Pagamento Confirmado! - Flores e Fé Perfumaria",
              html: `
                <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
                  <h1 style="color: #000; text-transform: uppercase; letter-spacing: 2px;">Flores e Fé</h1>
                  <hr style="border: 1px solid #eee; margin: 20px 0;" />
                  <h2>Obrigado, ${pedidoComCliente.clientes.nome}!</h2>
                  <p>Recebemos o seu pagamento via PIX referente ao pedido <strong>#${pedidoId.substring(0, 8)}</strong>.</p>
                  <p>O total da sua compra foi de <strong>R$ ${pedidoComCliente.total.toFixed(2).replace(".", ",")}</strong>.</p>
                  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Endereço de Entrega:</strong></p>
                    <p style="margin: 5px 0 0 0;">
                      ${pedidoComCliente.endereco_logradouro}, ${pedidoComCliente.endereco_numero} <br/>
                      ${pedidoComCliente.endereco_bairro} - ${pedidoComCliente.endereco_cidade}/${pedidoComCliente.endereco_estado} <br/>
                      CEP: ${pedidoComCliente.endereco_cep}
                    </p>
                  </div>
                  <p>Em breve, enviaremos as atualizações sobre a entrega do seu pacote.</p>
                  <br/>
                  <p style="font-size: 12px; color: #999;">Equipe Flores e Fé Perfumaria.</p>
                </div>
              `,
            });
            console.log(
              "E-mail de confirmação enviado com sucesso via Resend!",
            );
          } catch (emailError) {
            console.error("Erro do Resend ao enviar o e-mail:", emailError);
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erro no Webhook:", error);
    return NextResponse.json(
      { error: "Erro interno no Webhook" },
      { status: 500 },
    );
  }
}
