"use client";

import React, { useState } from "react";
import { useCart } from "../../contexts/CartContext";
import { processarCheckout } from "../actions/checkout";
import { useRouter } from "next/navigation";

// LISTA FÁCIL DE EDITAR: Adicione ou remova cidades aqui no futuro
const CIDADES_ENTREGA_LOCAL = [
  "sao jose do rio preto",
  // 'mirassol',
  // 'bady bassitt'
];

// Função utilitária para limpar acentos e maiúsculas (ex: "São José" vira "sao jose")
const normalizarTexto = (texto: string) => {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

export default function CheckoutPage() {
  const { cartItems, cartTotal } = useCart();
  const router = useRouter();

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
  const [isStreetReadOnly, setIsStreetReadOnly] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [cepError, setCepError] = useState(false);

  // NOVO ESTADO: Controla qual será o tipo de frete
  const [tipoFrete, setTipoFrete] = useState<"local" | "correios" | null>(null);

  const [isProcessando, setIsProcessando] = useState(false);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setCep(value);

    if (value.length === 8) {
      setIsSearching(true);
      setCepError(false);
      setTipoFrete(null); // Reseta o frete enquanto busca

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

          const hasStreet = data.logradouro && data.logradouro.length > 0;
          setIsStreetReadOnly(hasStreet);

          // VERIFICAÇÃO DE LOGÍSTICA
          const cidadeNormalizada = normalizarTexto(data.localidade);
          if (CIDADES_ENTREGA_LOCAL.includes(cidadeNormalizada)) {
            setTipoFrete("local");
          } else {
            setTipoFrete("correios");
          }
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

  const handleFinalizarCompra = async () => {
    if (!email || !nome || !cep || !endereco.logradouro || !numero) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsProcessando(true);

    const dadosDoPedido = {
      cliente: { email, nome, sobrenome },
      endereco: { ...endereco, cep, numero },
      carrinho: cartItems,
      total: cartTotal,
    };

    const resultado = await processarCheckout(dadosDoPedido);

    if (resultado.sucesso) {
      localStorage.removeItem("@FloresEFe:cart");
      if (resultado.pix) {
        localStorage.setItem("@FloresEFe:pix", JSON.stringify(resultado.pix));
      }
      router.push("/sucesso");
    } else {
      alert(resultado.erro);
      setIsProcessando(false);
    }
  };

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
          <div className="lg:col-span-7 space-y-8">
            <section className="bg-white p-8 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-6">
                1. Dados de Contato
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

            <section className="bg-white p-8 border border-gray-100 shadow-sm relative">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-6">
                2. Endereço de Entrega
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

                {/* LOGRADOURO E NÚMERO VOLTARAM AQUI */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                      Rua / Logradouro *
                    </label>
                    <input
                      type="text"
                      value={endereco.logradouro}
                      onChange={(e) =>
                        setEndereco({ ...endereco, logradouro: e.target.value })
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
                    Complemento / Ponto de Referência
                  </label>
                  <textarea
                    value={endereco.complemento}
                    onChange={(e) =>
                      setEndereco({ ...endereco, complemento: e.target.value })
                    }
                    rows={2}
                    className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors resize-none"
                    placeholder="Ex: Apto 42, Bloco B, casa de esquina, ao lado do mercado..."
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-stone-900 text-white p-8 sticky top-24">
              <h2 className="text-lg font-serif font-bold uppercase tracking-widest mb-8">
                Resumo do Pedido
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

                {/* EXIBIÇÃO DINÂMICA DA LOGÍSTICA */}
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

              <div className="flex justify-between items-center pt-6 border-t border-stone-700 mb-8">
                <span className="text-sm uppercase tracking-widest">Total</span>
                <span className="text-2xl font-bold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(cartTotal)}
                </span>
              </div>

              <button
                onClick={handleFinalizarCompra}
                disabled={cartItems.length === 0 || isProcessando || !tipoFrete}
                className="w-full bg-white text-black py-4 text-sm font-bold uppercase tracking-widest hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessando ? "Processando..." : "Finalizar Compra"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
