import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useLayoutEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { applyThemeToDocument, ThemeProvider, useTheme } from "@/context/ThemeContext";
import { DEFAULT_THEME } from "@/lib/themes";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
      { title: "Fragments — Leave an anonymous message" },
      {
        name: "description",
        content:
          "Your own anonymous wall. Friends leave fragments, kind words and questions; you read, answer and keep the ones you love.",
      },
      { name: "author", content: "Fragments" },
      { property: "og:title", content: "Fragments — Leave an anonymous message" },
      {
        property: "og:description",
        content: "Claim your link, share it anywhere, and collect anonymous fragments from the people who pass through.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://myfragments.vercel.app" },
      { property: "og:image", content: "https://myfragments.vercel.app/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Leave an anonymous message" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://myfragments.vercel.app/og-image.png" },
    ],
    scripts: [
      {
        children:
          "try{var ok=['cherry','cloud','moonlight','matcha','love-letter','y2k','lavender','sunshine','dark-academia','ocean','pixel','minimal','custom','dusk','pink-dream','midnight','vintage','lagoon','ember','forest','peach','starry','dreamy-pink-sky','sunset-blaze','noir-gold','desert-dunes','mint-cloud','rosewood','arctic','dreamy-rose','match-day','money-moves'];var pub=['/','/login','/signup','/privacy','/reset-password'];var site=pub.indexOf(location.pathname)>=0||location.pathname.split('/').filter(Boolean).length>1;var t=site?'moonlight':localStorage.getItem('fragments-theme');document.documentElement.setAttribute('data-theme',ok.indexOf(t)>=0?t:'moonlight');if(t==='custom'){var v=JSON.parse(localStorage.getItem('fragments-custom-vars')||'null');if(v){for(var k in v)document.documentElement.style.setProperty(k,v[k])}}if(!site){var o=JSON.parse(localStorage.getItem('fragments-theme-overrides')||'null');if(o){var ov=JSON.parse(localStorage.getItem('fragments-override-vars')||'null');if(ov){for(var k in ov)document.documentElement.style.setProperty(k,ov[k])}var sc=localStorage.getItem('fragments-override-scheme');if(sc)document.documentElement.style.colorScheme=sc;if(o.cardStyle)document.documentElement.setAttribute('data-card-style',o.cardStyle)}}}catch(e){document.documentElement.setAttribute('data-theme','moonlight')}",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&family=Baloo+2:wght@400;500;600;700;800&family=Caveat:wght@400;600;700&family=VT323&family=Great+Vibes&family=Merriweather+Sans:wght@400;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SiteThemeGuard />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster position="top-center" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// Pages that belong to the site itself, not to a wall: the homepage,
// login, signup, privacy and the password reset. They always wear
// the site's own theme (Moonlight) — never the last wall theme the
// browser happened to remember. Before this, changing a wall's theme
// repainted the homepage too, because the theme lives on the
// document and in localStorage, and nothing on those pages ever set
// it back. Walls (one path segment) and the gate wear their own
// themes, so they are left alone; anything deeper than one segment
// cannot be a wall, so it counts as a site page too. The reset runs
// in a layout effect, before paint, so there is no flash of the
// wrong theme on the way in.
const SITE_THEME_PATHS = ["/", "/login", "/signup", "/privacy", "/reset-password"];

function SiteThemeGuard() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setTheme } = useTheme();
  useLayoutEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const isSitePage =
      SITE_THEME_PATHS.includes(pathname) || segments.length > 1;
    if (!isSitePage) return;
    applyThemeToDocument(DEFAULT_THEME);
    setTheme(DEFAULT_THEME, null, null);
  }, [pathname, setTheme]);
  return null;
}
