"use client";

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useCart } from "../../contexts/CartContext";
import { processarCheckout } from "../actions/checkout";
import { useRouter } from "next/navigation";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";

// Inicializa o Mercado Pago
initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY as string, {
  locale: "pt-BR",
});

const CIDADES_ENTREGA_LOCAL = ["sao jose do rio preto"];

const normalizarTexto = (texto: string) => {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

export default function CheckoutPage() {
  const [erroMensagem, setErroMensagem] = useState<string | null>(null);
  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();

  // CONTROLE DE ETAPAS DO CHECKOUT
  const [etapa, setEtapa] = useState<1 | 2>(1);

  // ESTADOS DE DADOS
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [cep, setCep] = useState("");
  const [numero, setNumero] = useState("");
  const [endereco, setEndereco] = useState({
    logradouro: "",
    bairro: "",
    cidade: "",
    estado: "",
    complemento: "",
  });
  const mpInitialization = useMemo(
    () => ({
      amount: Number(cartTotal.toFixed(2)),
      payer: { email: email },
    }),
    [cartTotal, email],
  );

  const mpCustomization = useMemo(
    () => ({
      paymentMethods: { creditCard: "all" as const },
      visual: { style: { theme: "default" as const } },
    }),
    [],
  );

  // ESTADOS DE CONTROLE
  const [isStreetReadOnly, setIsStreetReadOnly] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [cepError, setCepError] = useState(false);
  const [tipoFrete, setTipoFrete] = useState<"local" | "correios" | null>(null);
  const [isProcessando, setIsProcessando] = useState(false);

  // ESTADOS DE PAGAMENTO
  const [metodoPagamento, setMetodoPagamento] = useState<"pix" | "cartao">(
    "pix",
  );
  const [dadosCartaoProntos, setDadosCartaoProntos] = useState(false);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setCep(value);

    if (value.length === 8) {
      setIsSearching(true);
      setCepError(false);
      setTipoFrete(null);

      try {
        const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
        const data = await response.json();

        if (data.erro) {
          setCepError(true);
          setEndereco((prev) => ({
            ...prev,
            logradouro: "",
            bairro: "",
            cidade: "",
            estado: "",
          }));
          setIsStreetReadOnly(true);
        } else {
          setEndereco((prev) => ({
            ...prev,
            logradouro: data.logradouro || "",
            bairro: data.bairro || "",
            cidade: data.localidade || "",
            estado: data.uf || "",
          }));

          setIsStreetReadOnly(data.logradouro && data.logradouro.length > 0);

          const cidadeNormalizada = normalizarTexto(data.localidade);
          setTipoFrete(
            CIDADES_ENTREGA_LOCAL.includes(cidadeNormalizada)
              ? "local"
              : "correios",
          );
        }
      } catch (error) {
        setCepError(true);
      } finally {
        setIsSearching(false);
      }
    } else {
      setEndereco((prev) => ({
        ...prev,
        logradouro: "",
        bairro: "",
        cidade: "",
        estado: "",
      }));
      setIsStreetReadOnly(true);
      setCepError(false);
      setTipoFrete(null);
    }
  };

  // BARREIRA DE VALIDAÇÃO: Só avança para o pagamento se tudo estiver OK
  const handleAvancarParaPagamento = () => {
    if (!email || !nome || !cep || !endereco.logradouro || !numero) {
      alert("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }
    if (!tipoFrete) {
      alert("Aguarde o cálculo do frete para prosseguir.");
      return;
    }
    setEtapa(2);
    // Rola a tela suavemente para o topo do formulário de pagamento
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalizarCompra = async (dadosPagamentoCartao?: any) => {
    setErroMensagem(null); // Limpa erros anteriores

    // Validação da Etapa 1 caso ele tente burlar
    if (!email || !nome || !cep || !endereco.logradouro || !numero) {
      setErroMensagem("Por favor, preencha todos os campos obrigatórios (*).");
      return { sucesso: false };
    }

    setIsProcessando(true);

    const dadosDoPedido = {
      cliente: { email, nome, sobrenome },
      endereco: { ...endereco, cep, numero },
      carrinho: cartItems,
      total: cartTotal,
      metodoPagamento: metodoPagamento,
      dadosCartao: dadosPagamentoCartao,
    };

    const resultado = await processarCheckout(dadosDoPedido);

    if (resultado.sucesso) {
      clearCart();
      localStorage.removeItem("@FloresEFe:cart");
      localStorage.removeItem("@FloresEFe:pix");
      if (resultado.pix) {
        localStorage.setItem("@FloresEFe:pix", JSON.stringify(resultado.pix));
      }
      localStorage.setItem("@FloresEFe:email", email);
      router.push("/sucesso");
      return { sucesso: true };
    } else {
      // Em vez de alert(), salvamos a mensagem na tela
      setErroMensagem(
        resultado.erro ||
          "Ocorreu um erro ao processar o pagamento. Tente novamente.",
      );
      setIsProcessando(false);
      return { sucesso: false };
    }
  };

  // =========================================================================
  // BLINDAGEM DO MERCADO PAGO: Evita que o iframe recarregue quando dá erro
  // =========================================================================

  // 1. Guardamos a nossa função principal numa "caixa fechada" (useRef)
  const finalizarCompraRef = useRef(handleFinalizarCompra);

  // 2. Atualizamos essa caixa silenciosamente nos bastidores
  useEffect(() => {
    finalizarCompraRef.current = handleFinalizarCompra;
  });

  // 3. Criamos funções blindadas que o Mercado Pago vai ler APENAS UMA VEZ!
  const onSubmitCartao = useCallback((param: any) => {
    return new Promise<void>(async (resolve, reject) => {
      // Usamos a função de dentro da caixa para ter sempre os dados mais frescos
      const res = await finalizarCompraRef.current(param.formData);
      if (res && res.sucesso) {
        resolve(); // Deu certo, o MP pode comemorar
      } else {
        reject(); // Deu erro, o MP vai apenas vibrar o botão, MAS SEM RECARREGAR A TELA!
      }
    });
  }, []);

  const onErrorCartao = useCallback((error: any) => {
    console.error("Erro MP:", error);
  }, []);

  const onReadyCartao = useCallback(() => {
    setDadosCartaoProntos(true);
  }, []);
  // =========================================================================

  return (
    <div className="min-h-screen bg-gray-50 py-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-serif font-bold tracking-widest text-gray-900 uppercase">
            Flores e Fé
          </h1>
          <p className="text-sm text-gray-500 mt-2 uppercase tracking-widest">
            Finalização Segura
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* COLUNA ESQUERDA: FLUXO DE CHECKOUT */}
          <div className="lg:col-span-7 space-y-6">
            {/* --- ETAPA 1: DADOS E ENTREGA --- */}
            {etapa === 1 ? (
              <div className="space-y-6 animate-fadeIn">
                <section className="bg-white p-8 border border-gray-100 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <span className="bg-stone-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      1
                    </span>
                    Dados de Contato
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors"
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                          Nome *
                        </label>
                        <input
                          type="text"
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                          Sobrenome
                        </label>
                        <input
                          type="text"
                          value={sobrenome}
                          onChange={(e) => setSobrenome(e.target.value)}
                          className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-white p-8 border border-gray-100 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <span className="bg-stone-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      2
                    </span>
                    Endereço de Entrega
                  </h2>
                  <div className="space-y-4">
                    <div className="w-1/3">
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                        CEP *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={8}
                          value={cep}
                          onChange={handleCepChange}
                          className={`w-full border-b py-2 focus:outline-none transition-colors ${cepError ? "border-red-500" : "border-gray-300 focus:border-black"}`}
                          placeholder="00000000"
                        />
                        {isSearching && (
                          <span className="absolute right-0 top-2 text-xs text-gray-400">
                            Buscando...
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-3">
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                          Rua / Logradouro *
                        </label>
                        <input
                          type="text"
                          value={endereco.logradouro}
                          onChange={(e) =>
                            setEndereco({
                              ...endereco,
                              logradouro: e.target.value,
                            })
                          }
                          readOnly={isStreetReadOnly}
                          className={`w-full border-b border-gray-300 py-2 focus:outline-none ${isStreetReadOnly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-yellow-50 focus:border-black"}`}
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                          Número *
                        </label>
                        <input
                          type="text"
                          value={numero}
                          onChange={(e) => setNumero(e.target.value)}
                          className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1">
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                          Bairro
                        </label>
                        <input
                          type="text"
                          value={endereco.bairro}
                          onChange={(e) =>
                            setEndereco({ ...endereco, bairro: e.target.value })
                          }
                          readOnly={isStreetReadOnly}
                          className={`w-full border-b border-gray-300 py-2 focus:outline-none ${isStreetReadOnly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-yellow-50 focus:border-black"}`}
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                          Cidade
                        </label>
                        <input
                          type="text"
                          value={endereco.cidade}
                          readOnly
                          className="w-full border-b border-gray-300 py-2 focus:outline-none bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                          Estado
                        </label>
                        <input
                          type="text"
                          value={endereco.estado}
                          readOnly
                          className="w-full border-b border-gray-300 py-2 focus:outline-none bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                        Complemento
                      </label>
                      <textarea
                        value={endereco.complemento}
                        onChange={(e) =>
                          setEndereco({
                            ...endereco,
                            complemento: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors resize-none"
                        placeholder="Ex: Apto 42, Bloco B..."
                      />
                    </div>
                  </div>
                </section>

                {/* BOTÃO PARA AVANÇAR */}
                <button
                  onClick={handleAvancarParaPagamento}
                  disabled={cartItems.length === 0}
                  className="w-full bg-stone-900 text-white py-4 text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50"
                >
                  Ir para o Pagamento
                </button>
              </div>
            ) : (
              /* --- ETAPA 2: PAGAMENTO --- */
              <div className="space-y-6 animate-fadeIn">
                {/* RESUMO DOS DADOS (Acordeão Fechado) */}
                <section className="bg-white p-6 border border-gray-100 shadow-sm flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-green-500"
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
                      Dados e Entrega
                    </h3>
                    <p className="text-sm text-gray-500">
                      {nome} • {endereco.logradouro}, {numero}
                    </p>
                  </div>
                  <button
                    onClick={() => setEtapa(1)}
                    className="text-xs font-bold text-stone-500 uppercase tracking-widest hover:text-black underline"
                  >
                    Alterar
                  </button>
                </section>

                {/* ÁREA DE PAGAMENTO */}
                <section className="bg-white p-8 border border-gray-100 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <span className="bg-stone-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      3
                    </span>
                    Pagamento
                  </h2>

                  <div className="mb-8">
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          setMetodoPagamento("pix");
                          setErroMensagem(null);
                        }}
                        className={`py-4 px-4 text-sm font-bold uppercase tracking-widest border transition-colors flex flex-col items-center gap-2 ${metodoPagamento === "pix" ? "bg-green-50 border-green-500 text-green-900" : "bg-transparent border-gray-200 text-gray-500 hover:border-gray-400"}`}
                      >
                        PIX
                        <span className="text-[10px] font-normal text-green-600">
                          Aprovação imediata
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setMetodoPagamento("cartao");
                          setErroMensagem(null);
                        }}
                        className={`py-4 px-4 text-sm font-bold uppercase tracking-widest border transition-colors flex flex-col items-center gap-2 ${metodoPagamento === "cartao" ? "bg-stone-50 border-stone-900 text-stone-900" : "bg-transparent border-gray-200 text-gray-500 hover:border-gray-400"}`}
                      >
                        Cartão de Crédito
                        <span className="text-[10px] font-normal text-gray-400">
                          Até 12x
                        </span>
                      </button>
                    </div>
                  </div>

                  {metodoPagamento === "cartao" && (
                    <div className="p-1 animate-fadeIn">
                      <Payment
                        initialization={mpInitialization}
                        customization={mpCustomization}
                        onSubmit={onSubmitCartao}
                        onError={onErrorCartao}
                        onReady={onReadyCartao}
                      />
                    </div>
                  )}

                  {metodoPagamento === "pix" && (
                    <button
                      onClick={() => handleFinalizarCompra()}
                      disabled={isProcessando}
                      className="w-full bg-green-600 text-white py-4 text-sm font-bold uppercase tracking-widest hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isProcessando ? "Processando..." : "Gerar Código PIX"}
                    </button>
                  )}
                  {erroMensagem && (
                    <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r flex items-start gap-3 animate-fadeIn">
                      <svg
                        className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      <p className="text-sm text-red-800 font-medium">
                        {erroMensagem}
                      </p>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: RESUMO DO PEDIDO (Estático) */}
          <div className="lg:col-span-5">
            <div className="bg-stone-900 text-white p-8 sticky top-24">
              <h2 className="text-lg font-serif font-bold uppercase tracking-widest mb-8">
                Sua Sacola
              </h2>

              <div className="max-h-64 overflow-y-auto pr-2 mb-6 space-y-6">
                {cartItems.map((item) => (
                  <div
                    key={`${item.id}-${item.tamanho}`}
                    className="flex gap-4 pb-6 border-b border-stone-700 last:border-0 last:pb-0"
                  >
                    <div className="w-16 h-20 bg-stone-800 flex-shrink-0">
                      <img
                        src={item.imagem}
                        alt={item.nome}
                        className="w-full h-full object-cover opacity-80"
                      />
                    </div>
                    <div className="flex flex-col justify-between flex-grow">
                      <div>
                        <h3 className="text-sm font-semibold">{item.nome}</h3>
                        <p className="text-xs text-stone-400 mt-1 uppercase">
                          {item.tamanho} - Qtd: {item.quantidade}
                        </p>
                      </div>
                      <p className="text-sm font-bold">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(item.preco * item.quantidade)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-sm text-stone-300 mb-8 border-t border-stone-700 pt-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(cartTotal)}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span>Frete</span>
                    {tipoFrete === "local" && (
                      <span className="text-[10px] text-yellow-500 uppercase mt-1">
                        Prazo: Até 2 Semanas (Entrega Própria)
                      </span>
                    )}
                    {tipoFrete === "correios" && (
                      <span className="text-[10px] text-stone-400 uppercase mt-1">
                        Prazo: Calculado no Envio (Correios)
                      </span>
                    )}
                  </div>
                  <span className="text-white">
                    {tipoFrete ? "Grátis" : "--"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-stone-700">
                <span className="text-sm uppercase tracking-widest">
                  Total a Pagar
                </span>
                <span className="text-2xl font-bold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(cartTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
