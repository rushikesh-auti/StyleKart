let razorpayScriptPromise;

export const loadRazorpay = () => {
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      razorpayScriptPromise = undefined;
      reject(new Error("Razorpay Checkout could not be loaded. Check your internet connection and try again."));
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
};
