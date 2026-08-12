"use client";

import { useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = {
  credential: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, string>
          ) => void;
        };
      };
    };
  }
}

type GoogleSignInButtonProps = {
  onCredential: (idToken: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
};

export function GoogleSignInButton({
  onCredential,
  onError,
  disabled,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    if (!clientId) return;

    const init = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) onCredential(response.credential);
        },
      });
      containerRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(containerRef.current, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: "320",
      });
      setReady(true);
    };

    if (window.google?.accounts?.id) {
      init();
      return;
    }

    const existing = document.querySelector('script[data-gis="1"]');
    if (existing) {
      existing.addEventListener("load", init);
      return () => existing.removeEventListener("load", init);
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.gis = "1";
    script.onload = init;
    script.onerror = () => onError?.("Could not load Google sign-in");
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [clientId, onCredential, onError]);

  if (!clientId) {
    return (
      <p className="text-center text-[13px] text-white/40">
        Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google sign-in.
      </p>
    );
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""} aria-busy={!ready}>
      <div ref={containerRef} className="flex min-h-[48px] justify-center" />
    </div>
  );
}
