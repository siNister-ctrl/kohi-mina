import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin routes — only ADMIN role
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Cashier routes — only CASHIER or ADMIN
    if (
      pathname.startsWith("/cashier") &&
      token?.role !== "CASHIER" &&
      token?.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Barista routes — only BARISTA or ADMIN
    if (
      pathname.startsWith("/barista") &&
      token?.role !== "BARISTA" &&
      token?.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/cashier/:path*", "/barista/:path*"],
};
