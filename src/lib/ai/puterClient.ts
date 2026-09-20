declare global {
  interface Window {
    puter?: {
      ai?: {
        chat: (
          prompt: string,
          options?: {
            model?: string;
            stream?: boolean;
          }
        ) => Promise<string | { text?: string; message?: { content?: string } }>;
      };
    };
  }
}

export interface PuterChatOptions {
  model?: string;
  timeoutMs?: number;
}

/**
 * Executes a zero-secret AI prompt via Puter.js in the browser.
 */
export async function callPuterChat(
  prompt: string,
  options: PuterChatOptions = {}
): Promise<string> {
  const model = options.model || "gemini-2.0-flash";
  const timeoutMs = options.timeoutMs || 35000;

  if (typeof window === "undefined") {
    throw new Error("Puter.js client can only be invoked in a browser environment.");
  }

  // Wait briefly for Puter.js script if not immediately ready
  let attempts = 0;
  while (!window.puter?.ai?.chat && attempts < 10) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    attempts++;
  }

  if (!window.puter?.ai?.chat) {
    throw new Error(
      "Puter.js is not loaded in this session. Please check your network connection."
    );
  }

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error("AI generation timed out after " + timeoutMs / 1000 + " seconds.")
        ),
      timeoutMs
    )
  );

  const apiPromise = (async () => {
    try {
      const response = await window.puter!.ai!.chat(prompt, { model });
      if (typeof response === "string") {
        return response;
      }
      if (response && typeof response === "object") {
        if ("text" in response && typeof response.text === "string") {
          return response.text;
        }
        if (
          "message" in response &&
          response.message &&
          typeof response.message.content === "string"
        ) {
          return response.message.content;
        }
      }
      return String(response || "");
    } catch (err: any) {
      // Retry with gemini-1.5-flash if gemini-2.0-flash fails
      if (model !== "gemini-1.5-flash") {
        try {
          const fallbackResponse = await window.puter!.ai!.chat(prompt, {
            model: "gemini-1.5-flash",
          });
          if (typeof fallbackResponse === "string") return fallbackResponse;
          if (fallbackResponse && typeof fallbackResponse === "object") {
            if ("text" in fallbackResponse && typeof fallbackResponse.text === "string") {
              return fallbackResponse.text;
            }
          }
        } catch {
          // Ignore and rethrow original
        }
      }
      throw err;
    }
  })();

  return Promise.race([apiPromise, timeoutPromise]);
}
