"use client";

import React from "react";
import Cart from "./Cart";
import { useCart } from "../contexts/CartContext";
// IMPORTANTE: Importando o componente de Link do Next.js
import Link from "next/link";

export default function Header() {
  const { cartCount, isCartOpen, openCart, closeCart } = useCart();

  return (
    <>
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-serif font-bold tracking-widest text-gray-900 uppercase">
              Flores e Fé
            </h1>
            <nav className="hidden md:flex gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition"
              >
                Início
              </Link>
              <Link
                href="/categoria/Feminino"
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition"
              >
                Feminino
              </Link>
              <Link
                href="/categoria/Masculino"
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition"
              >
                Masculino
              </Link>
              <Link
                href="/categoria/Unissex"
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition"
              >
                Unissex
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-5">
            <button className="text-gray-400 hover:text-gray-900 transition">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>

            <Link
              href="/pedidos"
              className="text-gray-400 hover:text-gray-900 transition"
              title="Meus Pedidos"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>

            <button
              onClick={openCart}
              className="text-gray-400 hover:text-gray-900 transition relative"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>

              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <Cart isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
}
