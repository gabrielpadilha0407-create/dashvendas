import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "team_session";

export function middleware(request: NextRequest) {
  const session = request.cookies.get(COOKIE_NAME)?.value;
  const isValid = Boolean(session) && session === process.env.AUTH_COOKIE_SECRET;
  const isLoginPage = request.nextUrl.pathname.startsWith("/login");

  if (!isValid && !isLoginPage) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  if (isValid && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
