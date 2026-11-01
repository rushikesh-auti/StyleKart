import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

let googleScriptPromise;

const loadGoogleIdentityServices = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          resolve();
        } else {
          googleScriptPromise = null;
          reject(new Error("Google sign-in could not be initialized."));
        }
      };
      script.onerror = () => {
        googleScriptPromise = null;
        reject(new Error("Google sign-in could not be loaded. Please try again."));
      };
      document.head.appendChild(script);
    });
  }

  return googleScriptPromise;
};

const GoogleSignInButton = ({ disabled, onCredential }) => {
  const buttonRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const [unavailableMessage, setUnavailableMessage] = useState("");

  onCredentialRef.current = onCredential;

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setUnavailableMessage(
        "Google sign-in is unavailable. Please use email and password.",
      );
      return undefined;
    }

    let active = true;
    const buttonElement = buttonRef.current;
    const renderGoogleButton = () => {
      if (!active || !buttonElement) return;
      buttonElement.innerHTML = "";
      window.google.accounts.id.renderButton(buttonElement, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: Math.min(360, buttonElement.clientWidth || 360),
      });
    };

    loadGoogleIdentityServices()
      .then(() => {
        if (!active || !buttonElement) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => {
            if (!active) return;
            if (!credential) {
              setUnavailableMessage(
                "Google sign-in did not return a credential. Please try again.",
              );
              return;
            }
            onCredentialRef.current(credential);
          },
        });
        renderGoogleButton();
        window.addEventListener("resize", renderGoogleButton);
      })
      .catch((error) => {
        if (active) setUnavailableMessage(error.message);
      });

    return () => {
      active = false;
      window.removeEventListener("resize", renderGoogleButton);
    };
  }, []);

  return (
    <div className="mt-5">
      {unavailableMessage ? (
        <p
          className="text-center text-sm text-slate-500"
          role="status"
          aria-live="polite"
        >
          {unavailableMessage}
        </p>
      ) : (
        <div
          ref={buttonRef}
          className={`flex justify-center${disabled ? " pointer-events-none opacity-60" : ""}`}
          aria-disabled={disabled}
        />
      )}
    </div>
  );
};

GoogleSignInButton.propTypes = {
  disabled: PropTypes.bool,
  onCredential: PropTypes.func.isRequired,
};

export default GoogleSignInButton;
