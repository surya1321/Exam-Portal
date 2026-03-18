import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Admin routes: require authenticated user
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !pathname.startsWith("/admin/signup")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Admin login/signup: redirect to dashboard if already logged in
  if ((pathname === "/admin/login" || pathname === "/admin/signup") && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  // Candidate exam API routes: require candidate_session cookie
  if (pathname.startsWith("/api/v1/exam/attempt/")) {
    const candidateSession = request.cookies.get("candidate_session");
    if (!candidateSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Candidate exam pages: redirect to login if no session
  if (pathname.includes("/attempt/") || pathname.includes("/result/")) {
    const candidateSession = request.cookies.get("candidate_session");
    if (!candidateSession) {
      const accessLink = pathname.split("/exam/")[1]?.split("/")[0];
      if (accessLink) {
        const url = request.nextUrl.clone();
        url.pathname = `/exam/${accessLink}/login`;
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/v1/exam/attempt/:path*",
    "/exam/:accessLink/attempt/:path*",
    "/exam/:accessLink/result/:path*",
  ],
};
