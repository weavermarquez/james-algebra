type QuestionOptions = {
  keepWhitespace?: boolean;
};

function question(_prompt: string, options?: QuestionOptions): string {
  const inDev = typeof process !== "undefined" && process.env?.NODE_ENV !== "production";
  if (inDev && typeof console !== "undefined") {
    const detail = options?.keepWhitespace ? "keeping whitespace" : "without whitespace";
    console.warn(
      "Using stubbed readline-sync.question; returning an empty string",
      detail,
    );
  }
  return "";
}

export default {
  question,
};
