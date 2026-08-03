import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "fm_access";
const ACCESS_KEY = process.env.ACCESS_KEY;

export function proxy(request: NextRequest) {
  const { nextUrl } = request;

  if (!ACCESS_KEY) {
    return NextResponse.next();
  }

  if (request.cookies.get(COOKIE_NAME)?.value === ACCESS_KEY) {
    return NextResponse.next();
  }

  const key = nextUrl.searchParams.get("key");
  if (key === ACCESS_KEY) {
    const url = nextUrl.clone();
    url.searchParams.delete("key");
    const response = NextResponse.redirect(url);
    response.cookies.set(COOKIE_NAME, ACCESS_KEY, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return response;
  }

  return new NextResponse("Access denied", { status: 403 });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
