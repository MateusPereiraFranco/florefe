import React from "react";

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-1">
          <h2 className="text-2xl font-serif text-white uppercase tracking-widest mb-6">
            Flores e Fé Perfumaria
          </h2>
          <p className="text-sm leading-relaxed text-stone-400">
            A sua boutique exclusiva de alta perfumaria. Selecionamos as
            melhores fragrâncias do mundo para você.
          </p>
        </div>
        <div>
          <h4 className="text-white text-sm font-bold uppercase tracking-widest mb-6">
            Navegação
          </h4>
          <ul className="space-y-4 text-sm">
            <li>
              <a href="#" className="hover:text-white transition">
                Perfumes Masculinos
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition">
                Perfumes Femininos
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition">
                Perfumes de Nicho
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition">
                Kits e Presentes
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-bold uppercase tracking-widest mb-6">
            Ajuda
          </h4>
          <ul className="space-y-4 text-sm">
            <li>
              <a href="#" className="hover:text-white transition">
                Fale Conosco
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition">
                Política de Trocas
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition">
                Dúvidas Frequentes
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition">
                Rastrear Pedido
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-bold uppercase tracking-widest mb-6">
            Newsletter
          </h4>
          <p className="text-sm mb-4 text-stone-400">
            Receba acesso antecipado a lançamentos e ofertas exclusivas.
          </p>
          <div className="flex">
            <input
              type="email"
              placeholder="Seu e-mail"
              className="bg-stone-800 text-white px-4 py-3 w-full outline-none focus:ring-1 focus:ring-stone-500 text-sm"
            />
            <button className="bg-white text-black px-4 py-3 text-sm font-bold uppercase hover:bg-stone-200 transition">
              Assinar
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
