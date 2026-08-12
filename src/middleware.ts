import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Esta é a função principal que o Next.js estava procurando
export function middleware(request: NextRequest) {
  // Por enquanto, estamos apenas permitindo que todas as páginas carreguem normalmente.
  // Mais para frente, é aqui que colocaremos a regra de bloquear usuários não logados de acessar o checkout.
  return NextResponse.next();
}

// O matcher define em quais rotas o middleware deve atuar
export const config = {
  matcher: [
    /*
     * Ignora as rotas internas do Next.js e arquivos estáticos para não perder performance:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico (ícone do site)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
