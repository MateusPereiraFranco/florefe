"use client";

import React, { useState, useEffect } from "react";
import {
  buscarTodosProdutosAdmin,
  adicionarProdutoAdmin,
  alternarVisibilidadeProduto,
  uploadImagemProduto,
  editarProdutoAdmin,
} from "../../actions/admin";
import Link from "next/link";

export default function GestaoProdutosPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Estados do Formulário
  const [produtoEditando, setProdutoEditando] = useState<string | null>(null); // Guarda o ID se estiver editando
  const [nome, setNome] = useState("");
  const [marca, setMarca] = useState("");
  const [preco, setPreco] = useState("");
  const [precoAntigo, setPrecoAntigo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");

  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  const handleSelecionarImagem = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setArquivoImagem(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Preenche o formulário e rola a tela para o topo
  const handleEditarClique = (produto: any) => {
    setProdutoEditando(produto.id);
    setNome(produto.nome);
    setMarca(produto.marca);
    setPreco(produto.preco.toString());
    setPrecoAntigo(produto.preco_antigo ? produto.preco_antigo.toString() : "");
    setCategoria(produto.categoria);
    setDescricao(produto.descricao);
    setPreviewUrl(produto.imagem_url); // Mostra a imagem antiga
    setArquivoImagem(null); // Reseta o arquivo físico (só sobe foto nova se ele escolher)

    window.scrollTo({ top: 0, behavior: "smooth" }); // Rola pro topo suavemente
  };

  const cancelarEdicao = () => {
    setProdutoEditando(null);
    setNome("");
    setMarca("");
    setPreco("");
    setPrecoAntigo("");
    setCategoria("");
    setDescricao("");
    setArquivoImagem(null);
    setPreviewUrl(null);
  };

  const handleSalvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !marca || !preco || !categoria || !descricao) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    // Se é um produto novo, ele TEM que mandar foto. Se está editando, é opcional.
    if (!produtoEditando && !arquivoImagem) {
      alert("Selecione uma imagem para o novo produto.");
      return;
    }

    setIsSalvando(true);

    try {
      let urlFinalDaImagem = previewUrl; // Por padrão, mantém a URL antiga se estiver editando

      // Se ele escolheu um arquivo NOVO no computador, fazemos o upload
      if (arquivoImagem) {
        const formData = new FormData();
        formData.append("imagem", arquivoImagem);
        const uploadResult = await uploadImagemProduto(formData);

        if (!uploadResult.sucesso || !uploadResult.url) {
          throw new Error(uploadResult.erro || "Falha ao subir a nova imagem.");
        }
        urlFinalDaImagem = uploadResult.url;
      }

      const precoFormatado = Number(preco.replace(",", "."));
      const precoAntigoFormatado = precoAntigo
        ? Number(precoAntigo.replace(",", "."))
        : null;

      const dadosProduto = {
        nome,
        marca,
        categoria,
        descricao,
        preco: precoFormatado,
        preco_antigo: precoAntigoFormatado,
        imagem_url: urlFinalDaImagem as string,
      };

      if (produtoEditando) {
        // ATUALIZAÇÃO
        const resultado = await editarProdutoAdmin(
          produtoEditando,
          dadosProduto,
        );
        if (!resultado.sucesso) throw new Error(resultado.erro);
        alert("Produto atualizado com sucesso!");
      } else {
        // CRIAÇÃO
        const resultado = await adicionarProdutoAdmin(dadosProduto);
        if (!resultado.sucesso) throw new Error(resultado.erro);
        alert("Produto cadastrado com sucesso!");
      }

      cancelarEdicao(); // Limpa tudo
      await carregarProdutos(); // Atualiza a tabela
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setIsSalvando(false);
    }
  };

  const handleAlternarVisibilidade = async (
    id: string,
    statusAtual: boolean,
  ) => {
    setCarregando(true);
    const resultado = await alternarVisibilidadeProduto(id, statusAtual);
    if (resultado.sucesso) {
      await carregarProdutos();
    } else {
      alert("Erro ao alterar visibilidade.");
    }
    setCarregando(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* CABEÇALHO */}
        <div className="flex justify-between items-center bg-white p-6 rounded shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-serif font-bold uppercase tracking-widest">
              Gestão de Estoque
            </h1>
            <p className="text-sm text-gray-500">
              Adicione novos perfumes, edite ou oculte itens esgotados.
            </p>
          </div>
          <Link
            href="/painel-floresefe-secreto"
            className="text-sm font-bold uppercase tracking-widest text-stone-500 hover:text-black underline"
          >
            Voltar ao Painel
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FORMULÁRIO */}
          <div
            className={`lg:col-span-1 p-6 rounded shadow-sm border h-fit transition-colors ${produtoEditando ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-100"}`}
          >
            <h2 className="text-sm font-bold uppercase tracking-widest text-stone-900 mb-6 border-b pb-4 flex justify-between items-center">
              {produtoEditando ? "Editando Produto" : "Novo Produto"}
              {produtoEditando && (
                <button
                  onClick={cancelarEdicao}
                  className="text-[10px] text-red-500 hover:text-red-700 underline"
                >
                  Cancelar Edição
                </button>
              )}
            </h2>

            <form onSubmit={handleSalvarProduto} className="space-y-4">
              {/* UPLOAD IMAGEM */}
              <div className="mb-6 flex flex-col items-center justify-center">
                {previewUrl ? (
                  <div className="relative w-32 h-32 mb-2 rounded overflow-hidden border border-gray-200">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setArquivoImagem(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition-colors bg-white">
                    <svg
                      className="w-8 h-8 text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      ></path>
                    </svg>
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      Escolher Foto
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      onChange={handleSelecionarImagem}
                      className="hidden"
                    />
                  </label>
                )}
                {produtoEditando && previewUrl && !arquivoImagem && (
                  <p className="text-[10px] text-gray-500 mt-2 text-center">
                    A foto antiga será mantida.
                    <br />
                    Apague se quiser enviar uma nova.
                  </p>
                )}
              </div>

              {/* NOME E MARCA */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Nome do Perfume
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-stone-900 text-sm bg-transparent"
                  placeholder="Ex: Essencial Oud"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-stone-900 text-sm bg-transparent"
                    placeholder="Ex: Natura"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Categoria
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-stone-900 text-sm bg-transparent"
                  >
                    <option value="">Selecione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Unissex">Unissex</option>
                  </select>
                </div>
              </div>

              {/* PREÇOS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Preço Atual
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-stone-900 text-sm bg-transparent"
                    placeholder="199.90"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 text-gray-400">
                    Preço Antigo (Opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={precoAntigo}
                    onChange={(e) => setPrecoAntigo(e.target.value)}
                    className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-stone-900 text-sm bg-transparent"
                    placeholder="249.90"
                  />
                </div>
              </div>

              {/* DESCRIÇÃO */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Descrição
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-stone-900 text-sm resize-none bg-white"
                  placeholder="Detalhes da fragrância..."
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSalvando}
                className={`w-full mt-6 text-white py-3 uppercase tracking-widest text-sm font-bold flex justify-center items-center gap-2 transition-colors disabled:opacity-50 ${produtoEditando ? "bg-yellow-600 hover:bg-yellow-700" : "bg-stone-900 hover:bg-black"}`}
              >
                {isSalvando
                  ? "Salvando..."
                  : produtoEditando
                    ? "Atualizar Produto"
                    : "Cadastrar Produto"}
              </button>
            </form>
          </div>

          {/* TABELA DE PRODUTOS CADASTRADOS */}
          <div className="lg:col-span-2 bg-white rounded shadow-sm border border-gray-100 overflow-hidden h-fit">
            {carregando ? (
              <div className="p-12 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">
                Carregando estoque...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-max">
                  <thead>
                    <tr className="bg-stone-100 text-stone-600 text-xs uppercase tracking-widest">
                      <th className="p-4 border-b">Produto</th>
                      <th className="p-4 border-b">Categoria</th>
                      <th className="p-4 border-b">Preço</th>
                      <th className="p-4 border-b text-center">Status</th>
                      <th className="p-4 border-b text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-gray-500 text-sm"
                        >
                          Nenhum produto cadastrado.
                        </td>
                      </tr>
                    ) : (
                      produtos.map((produto) => (
                        <tr
                          key={produto.id}
                          className={`hover:bg-gray-50 transition-colors border-b last:border-0 ${!produto.ativo ? "opacity-60 bg-gray-50" : ""} ${produtoEditando === produto.id ? "bg-yellow-50" : ""}`}
                        >
                          <td className="p-4 flex items-center gap-3 max-w-[250px]">
                            <div className="w-10 h-12 bg-gray-200 overflow-hidden rounded-sm flex-shrink-0">
                              <img
                                src={produto.imagem_url}
                                alt={produto.nome}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <span className="text-sm font-bold text-gray-900 block truncate">
                                {produto.nome}
                              </span>
                              <span className="text-xs text-gray-500">
                                {produto.marca}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-xs text-gray-600">
                            {produto.categoria}
                          </td>
                          <td className="p-4 text-sm font-bold text-gray-900">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(produto.preco)}
                            {produto.preco_antigo && (
                              <span className="block text-[10px] text-gray-400 line-through">
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(produto.preco_antigo)}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() =>
                                handleAlternarVisibilidade(
                                  produto.id,
                                  produto.ativo,
                                )
                              }
                              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors ${
                                produto.ativo
                                  ? "bg-green-50 border-green-200 text-green-700 hover:bg-red-50 hover:border-red-200"
                                  : "bg-stone-100 border-stone-300 text-stone-500 hover:bg-green-50 hover:border-green-200"
                              }`}
                            >
                              {produto.ativo ? "Em Estoque" : "Esgotado"}
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleEditarClique(produto)}
                              className="text-stone-500 hover:text-stone-900 p-2 rounded transition-colors bg-gray-100 hover:bg-gray-200"
                              title="Editar Produto"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                ></path>
                              </svg>
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
