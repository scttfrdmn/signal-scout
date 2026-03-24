import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const ALLOWED_DOMAIN = "playgroundlogic.co";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId, sessionClaims } = await auth.protect();

  const email = (sessionClaims?.email as string) ?? "";
  if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
