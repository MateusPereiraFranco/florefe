"use client";

import React from "react";
import { useCart } from "../contexts/CartContext";
import Link from "next/link";

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  // Puxando todas as funcionalidades que criamos no cérebro do carrinho
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl z-[70] transform transition-transform duration-500 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-serif font-bold uppercase tracking-widest text-gray-900">
            Sua Sacola
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <p className="mb-4 text-sm tracking-widest uppercase">
                Sua sacola está vazia.
              </p>
              <button
                onClick={onClose}
                className="text-black border-b border-black text-sm font-bold pb-1"
              >
                Continuar Comprando
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={`${item.id}-${item.tamanho}`}
                className="flex gap-4 mb-6"
              >
                <div className="w-20 h-24 bg-gray-100 flex-shrink-0 overflow-hidden">
                  <img
                    src={item.imagem}
                    alt={item.nome}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col flex-grow justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {item.nome}
                      </h3>
                      <button
                        onClick={() => removeFromCart(item.id, item.tamanho)}
                        className="text-gray-400 hover:text-red-500 transition ml-2"
                        title="Remover"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                      {item.tamanho}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-gray-200">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.tamanho,
                            item.quantidade - 1,
                          )
                        }
                        className="px-2 py-1 text-gray-500 hover:text-black transition"
                      >
                        -
                      </button>
                      <span className="px-2 text-sm">{item.quantidade}</span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.tamanho,
                            item.quantidade + 1,
                          )
                        }
                        className="px-2 py-1 text-gray-500 hover:text-black transition"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-bold text-black">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(item.preco)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-600 uppercase tracking-widest">
                Subtotal
              </span>
              <span className="text-lg font-bold text-black">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(cartTotal)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              Frete e taxas calculados no checkout.
            </p>
            <Link
              href="/checkout"
              onClick={onClose}
              className="block w-full bg-stone-900 text-white text-center py-4 text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors"
            >
              Finalizar Compra
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
