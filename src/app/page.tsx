import React from "react";
import { supabase } from "../lib/supabase";

export default async function Home() {
  const { data: produtos_reais, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("em_estoque", true)
    .eq("ativo", true); // <--- A MÁGICA ENTRA AQUI!

  if (error) {
    console.error("Erro ao buscar produtos:", error);
  }

  return (
    <div className="font-sans">
      {/* BANNER PRINCIPAL (HERO) */}
      <section className="relative w-full h-[70vh] bg-stone-900 flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1595532542520-252c2ee1fc89?q=80&w=1920&auto=format&fit=crop"
          alt="Frasco de perfume de luxo"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <span className="text-stone-300 text-sm tracking-[0.3em] uppercase mb-4 block">
            Nova Coleção
          </span>
          <h2 className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight">
            A arte de deixar sua marca no mundo.
          </h2>
          <button className="mt-4 bg-white text-black px-10 py-4 text-sm font-bold tracking-widest uppercase hover:bg-stone-200 transition-colors duration-300">
            Descobrir Fragrâncias
          </button>
        </div>
      </section>

      {/* FAIXA DE CONFIANÇA (BENEFÍCIOS) */}
      <section className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="flex flex-col items-center pt-4 md:pt-0">
            <svg
              className="w-6 h-6 mb-3 text-gray-800"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              100% Original
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Garantia de procedência
            </p>
          </div>
          <div className="flex flex-col items-center pt-4 md:pt-0">
            <svg
              className="w-6 h-6 mb-3 text-gray-800"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Até 10x Sem Juros
            </h3>
            <p className="text-xs text-gray-500 mt-1">No cartão de crédito</p>
          </div>
          <div className="flex flex-col items-center pt-4 md:pt-0">
            <svg
              className="w-6 h-6 mb-3 text-gray-800"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 8l-8 5-8-5V6l8 5 8-5m0 0v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8"
              />
            </svg>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Frete Grátis
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Nas compras acima de R$ 499
            </p>
          </div>
        </div>
      </section>

      {/* VITRINE DE PRODUTOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-serif text-gray-900">
              Mais Desejados
            </h2>
            <p className="text-gray-500 mt-2">
              As fragrâncias que estão em alta nesta temporada.
            </p>
          </div>
          <a
            href="#"
            className="hidden sm:block text-sm font-bold text-black border-b border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition"
          >
            Ver todos
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {produtos_reais &&
            produtos_reais.map((produto) => (
              <div key={produto.id} className="group flex flex-col relative">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100 mb-4 cursor-pointer">
                  <img
                    src={produto.imagem_url}
                    alt={produto.nome}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0 hidden md:block">
                    <a
                      href={`/produto/${produto.id}`}
                      className="block w-full bg-white/90 backdrop-blur-sm text-black text-center py-3 text-sm font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
                    >
                      Ver Detalhes
                    </a>
                  </div>
                </div>

                <div className="flex flex-col flex-grow">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                    {produto.marca}
                  </p>
                  <h3 className="text-lg text-gray-900 font-medium cursor-pointer hover:underline underline-offset-4">
                    {produto.nome}
                  </h3>

                  {/* Lógica de Preço com Promoção Adicionada Aqui */}
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-lg text-black font-semibold">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(produto.preco)}
                    </p>
                    {produto.preco_antigo && (
                      <p className="text-sm text-gray-400 line-through">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(produto.preco_antigo)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
