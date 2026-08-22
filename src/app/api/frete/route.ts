import { NextResponse } from "next/server";

// =========================================================================
// REGRAS DE NEGÓCIO - FRETE (Pode alterar esses valores depois)
// =========================================================================
const VALOR_MINIMO_COMPRA = 250.0; // Valor mínimo que o cliente precisa gastar no carrinho
const DESCONTO_NO_FRETE = 15.0; // Quantos reais de desconto ele ganha no frete

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cepDestino, carrinho } = body;

    if (!cepDestino || !carrinho || carrinho.length === 0) {
      return NextResponse.json(
        { sucesso: false, erro: "CEP de destino e carrinho são obrigatórios." },
        { status: 400 },
      );
    }

    // 1. Calcula o total do carrinho para saber se tem direito ao desconto
    const totalCarrinho = carrinho.reduce(
      (acc: number, item: any) => acc + item.preco * item.quantidade,
      0,
    );

    // 2. Mapeando os itens para a transportadora
    const products = carrinho.map((item: any) => ({
      id: item.id,
      // FUTURO: Quando o painel admin estiver pronto, troque os valores fixos pelas propriedades do item.
      // Exemplo: width: item.largura || 11,
      width: 11,
      height: 16,
      length: 11,
      weight: 0.3 * item.quantidade, // FUTURO: item.peso * item.quantidade
      insurance_value: item.preco,
      quantity: item.quantidade,
    }));

    const payload = {
      from: { postal_code: process.env.CEP_ORIGEM },
      to: { postal_code: cepDestino.replace(/\D/g, "") },
      products: products,
      options: {
        receipt: false,
        own_hand: false,
      },
    };

    const response = await fetch(
      `${process.env.MELHOR_ENVIO_URL}/me/shipment/calculate`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
          "User-Agent": "Flores e Fe Integration",
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro na API do Melhor Envio:", data);
      return NextResponse.json(
        { sucesso: false, erro: "Erro ao consultar a transportadora." },
        { status: response.status },
      );
    }

    // 3. Filtra os erros e aplica as regras de desconto da loja
    const servicosValidos = data
      .filter((servico: any) => !servico.error)
      .map((servico: any) => {
        let precoFinal = Number(servico.price);

        // Se o carrinho bateu a meta, aplica o desconto
        if (totalCarrinho >= VALOR_MINIMO_COMPRA) {
          precoFinal = precoFinal - DESCONTO_NO_FRETE;

          // Trava de segurança: garante que o frete nunca fique negativo (vira frete grátis)
          if (precoFinal < 0) {
            precoFinal = 0;
          }
        }

        return {
          ...servico,
          price: precoFinal.toFixed(2), // Substitui o preço cobrado da transportadora pelo preço com desconto
          preco_original: servico.price, // Guarda o preço original nos bastidores caso precisem no futuro
        };
      });

    return NextResponse.json(
      { sucesso: true, fretes: servicosValidos },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro interno ao calcular frete:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Erro interno no servidor." },
      { status: 500 },
    );
  }
}
