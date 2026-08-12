"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

export default function ProdutoPage() {
  const params = useParams();
  const id = params.id as string;

  // Estados para guardar os dados do banco e controlar a interface
  const [produto, setProduto] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [tamanho, setTamanho] = useState("50ml");
  const [imagemAtiva, setImagemAtiva] = useState(0);
  const { addToCart, openCart } = useCart();

  // Busca os dados no Supabase assim que a página carrega
  useEffect(() => {
    async function buscarProduto() {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("id", id)
        .single(); // Garante que trará apenas 1 produto

      if (data) {
        setProduto(data);
      }
      setCarregando(false);
    }

    if (id) buscarProduto();
  }, [id]);

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center font-serif text-xl tracking-widest">
        Carregando a essência...
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="min-h-screen flex items-center justify-center font-serif text-xl tracking-widest">
        Perfume não encontrado.
      </div>
    );
  }

  // Como ainda não temos múltiplas imagens no banco, criamos um array repetindo a principal para a galeria funcionar
  const imagensGaleria = [
    produto.imagem_url,
    produto.imagem_url,
    produto.imagem_url,
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 font-sans">
      {/* Navegação Estrutural (Breadcrumb) */}
      <nav className="flex text-xs text-gray-500 uppercase tracking-widest mb-8">
        <a href="/" className="hover:text-black transition">
          Início
        </a>
        <span className="mx-2">/</span>
        <a href="#" className="hover:text-black transition">
          {produto.categoria}
        </a>
        <span className="mx-2">/</span>
        <span className="text-black font-semibold">{produto.nome}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Lado Esquerdo: Galeria de Imagens */}
        <div className="flex flex-col-reverse md:flex-row gap-4 lg:gap-6">
          <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-visible">
            {imagensGaleria.map((img, index) => (
              <button
                key={index}
                onClick={() => setImagemAtiva(index)}
                className={`w-20 h-24 flex-shrink-0 bg-gray-100 overflow-hidden border-2 transition-all duration-200 ${imagemAtiva === index ? "border-black" : "border-transparent opacity-60 hover:opacity-100"}`}
              >
                <img
                  src={img}
                  alt={`Miniatura ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          <div className="flex-grow bg-gray-100 aspect-[4/5] overflow-hidden relative">
            <img
              src={imagensGaleria[imagemAtiva]}
              alt={produto.nome}
              className="w-full h-full object-cover object-center transition-opacity duration-500"
            />
          </div>
        </div>

        {/* Lado Direito: Informações e Compra */}
        <div className="flex flex-col pt-4">
          <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">
            {produto.marca}
          </p>
          <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-4 leading-tight">
            {produto.nome}
          </h1>

          {/* Lógica de Preço com Promoção */}
          <div className="flex items-center gap-4 mb-8">
            <p className="text-2xl text-black font-semibold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(produto.preco)}
            </p>
            {produto.preco_antigo && (
              <p className="text-lg text-gray-400 line-through">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(produto.preco_antigo)}
              </p>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed mb-8">
            {produto.descricao ||
              "Uma fragrância luminosa e sofisticada. Uma alquimia poética altamente condensada e gráfica, que deixa uma assinatura inesquecível por onde passa."}
          </p>

          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Selecione o Tamanho
            </h3>
            <div className="flex gap-4">
              {["50ml", "100ml"].map((tam) => (
                <button
                  key={tam}
                  onClick={() => setTamanho(tam)}
                  className={`px-8 py-3 text-sm font-bold tracking-wider uppercase border transition-all duration-200 ${tamanho === tam ? "border-black bg-black text-white" : "border-gray-300 text-gray-700 hover:border-black"}`}
                >
                  {tam}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              addToCart({
                id: produto.id,
                nome: produto.nome,
                tamanho: tamanho,
                preco: produto.preco,
                quantidade: 1,
                imagem: produto.imagem_url,
              });
              // ADEUS ALERT. Olá, experiência de luxo!
              openCart();
            }}
            className="w-full bg-stone-900 text-white py-5 text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors mb-10"
          >
            Adicionar à Sacola
          </button>

          <div className="border-t border-gray-200 py-6">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              <span>Envio em embalagem especial Flores e Fé.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
