"use client";

import React, { useState, useEffect } from 'react';
import { buscarTodosProdutosAdmin, adicionarProdutoAdmin, alternarVisibilidadeProduto } from '../../actions/admin';
import Link from 'next/link';

export default function GestaoProdutosPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Estados do Formulário
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [tamanho, setTamanho] = useState('');
  const [imagem, setImagem] = useState(''); // Por enquanto usaremos URL de imagem (ex: imgur, postimages)
  const [isSalvando, setIsSalvando] = useState(false);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    setCarregando(true);
    const resultado = await buscarTodosProdutosAdmin();
    if (resultado.sucesso) {
      setProdutos(resultado.produtos || []);
    }
    setCarregando(false);
  };

  const handleCadastrarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !preco || !tamanho || !imagem) {
      alert("Preencha todos os campos.");
      return;
    }

    setIsSalvando(true);
    const precoFormatado = Number(preco.replace(',', '.')); // Garante que o banco aceite o número

    const resultado = await adicionarProdutoAdmin({
      nome,
      preco: precoFormatado,
      tamanho,
      imagem
    });

    if (resultado.sucesso) {
      // Limpa os campos após salvar
      setNome(''); setPreco(''); setTamanho(''); setImagem('');
      await carregarProdutos(); // Atualiza a tabela
      alert("Produto cadastrado com sucesso!");
    } else {
      alert("Erro ao cadastrar produto: " + resultado.erro);
    }
    setIsSalvando(false);
  };

  const handleAlternarVisibilidade = async (id: string, statusAtual: boolean) => {
    setCarregando(true);
    const resultado = await alternarVisibilidadeProduto(id, statusAtual);
    if (resultado.sucesso) {
      await carregarProdutos(); // Atualiza a tabela para refletir a mudança
    } else {
      alert("Erro ao alterar visibilidade.");
    }
    setCarregando(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-center bg-white p-6 rounded shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-serif font-bold uppercase tracking-widest">Gestão de Estoque</h1>
            <p className="text-sm text-gray-500">Adicione novos perfumes ou oculte itens esgotados.</p>
          </div>
          <Link href="/painel-floresefe-secreto" className="text-sm font-bold uppercase tracking-widest text-stone-500 hover:text-black underline">
            Voltar ao Painel
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* FORMULÁRIO DE CADASTRO */}
          <div className="md:col-span-1 bg-white p-6 rounded shadow-sm border border-gray-100 h-fit">
            <h2 className="text-sm font-bold uppercase tracking-widest text-stone-900 mb-6 border-b pb-4">Novo Produto</h2>
            <form onSubmit={handleCadastrarProduto} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Perfume</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-stone-900 text-sm" placeholder="Ex: Essencial Oud" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preço (R$)</label>
                  <input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-stone-900 text-sm" placeholder="199.90" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tamanho/Vol</label>
                  <input type="text" value={tamanho} onChange={(e) => setTamanho(e.target.value)} className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-stone-900 text-sm" placeholder="100ml" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link da Imagem</label>
                <input type="text" value={imagem} onChange={(e) => setImagem(e.target.value)} className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-stone-900 text-sm" placeholder="https://site.com/imagem.jpg" />
                <p className="text-[10px] text-gray-400 mt-1">Cole a URL direta da imagem (JPG ou PNG).</p>
              </div>
              
              <button type="submit" disabled={isSalvando} className="w-full mt-4 bg-stone-900 text-white py-3 uppercase tracking-widest text-sm font-bold hover:bg-black disabled:opacity-50">
                {isSalvando ? 'Salvando...' : 'Cadastrar Produto'}
              </button>
            </form>
          </div>

          {/* TABELA DE PRODUTOS CADASTRADOS */}
          <div className="md:col-span-2 bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
            {carregando ? (
              <div className="p-12 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">Carregando estoque...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-100 text-stone-600 text-xs uppercase tracking-widest">
                      <th className="p-4 border-b">Produto</th>
                      <th className="p-4 border-b">Tamanho</th>
                      <th className="p-4 border-b">Preço</th>
                      <th className="p-4 border-b text-center">Status no Site</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500 text-sm">Nenhum produto cadastrado ainda.</td>
                      </tr>
                    ) : (
                      produtos.map((produto) => (
                        <tr key={produto.id} className={`hover:bg-gray-50 transition-colors border-b last:border-0 ${!produto.ativo ? 'opacity-60 bg-gray-50' : ''}`}>
                          <td className="p-4 flex items-center gap-3">
                            <div className="w-10 h-12 bg-gray-200 overflow-hidden">
                              <img src={produto.imagem} alt={produto.nome} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">{produto.nome}</span>
                          </td>
                          <td className="p-4 text-xs text-gray-600">{produto.tamanho}</td>
                          <td className="p-4 text-sm font-bold text-gray-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco)}
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => handleAlternarVisibilidade(produto.id, produto.ativo)}
                              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors ${
                                produto.ativo 
                                  ? 'bg-green-50 border-green-200 text-green-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700' 
                                  : 'bg-stone-100 border-stone-300 text-stone-500 hover:bg-green-50 hover:border-green-200 hover:text-green-700'
                              }`}
                            >
                              {produto.ativo ? 'Em Estoque (Ocultar)' : 'Esgotado (Exibir)'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}