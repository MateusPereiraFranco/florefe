import React from "react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";

// Atualizamos a tipagem para indicar que params agora é uma Promise
export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ nome: string }>;
}) {
  // Aguardamos (await) o Next.js processar a URL antes de acessar o "nome"
  const resolvedParams = await params;

  // Descodifica o nome da URL (ex: "Feminino")
  const categoriaNome = decodeURIComponent(resolvedParams.nome);

  // Busca no Supabase filtrando pela categoria
  const { data: produtos, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("categoria", categoriaNome)
    .eq("em_estoque", true)
    .eq("ativo", true);

  if (error) {
    console.error("Erro ao buscar produtos da categoria:", error);
  }

  return (
    <div className="font-sans max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="mb-12 border-b border-gray-200 pb-8">
        <h1 className="text-4xl font-serif text-gray-900 mb-4">
          {categoriaNome}
        </h1>
        <p className="text-gray-500">
          Explore nossa seleção exclusiva de fragrâncias.
        </p>
      </div>

      {produtos && produtos.length === 0 ? (
        <div className="text-center py-20 text-gray-500 uppercase tracking-widest">
          Nenhum perfume encontrado nesta categoria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {produtos?.map((produto) => (
            <div key={produto.id} className="group flex flex-col relative">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100 mb-4 cursor-pointer">
                <img
                  src={produto.imagem_url}
                  alt={produto.nome}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0 hidden md:block">
                  <Link
                    href={`/produto/${produto.id}`}
                    className="block w-full bg-white/90 backdrop-blur-sm text-black text-center py-3 text-sm font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
                  >
                    Ver Detalhes
                  </Link>
                </div>
              </div>

              <div className="flex flex-col flex-grow">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                  {produto.marca}
                </p>
                <h3 className="text-lg text-gray-900 font-medium cursor-pointer hover:underline underline-offset-4">
                  {produto.nome}
                </h3>

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
      )}
    </div>
  );
}
