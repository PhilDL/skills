const configuredProvider = process.env.EVAL_PROVIDER?.toLowerCase();
const provider =
  configuredProvider ??
  (process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY ? "openai" : "anthropic");

if (provider !== "anthropic" && provider !== "openai") {
  console.error(`Unsupported EVAL_PROVIDER "${provider}". Use "anthropic" or "openai".`);
  process.exit(1);
}

const missing =
  provider === "openai"
    ? [
        process.env.OPENAI_API_KEY ? null : "OPENAI_API_KEY",
        process.env.EVAL_MODEL || process.env.OPENAI_MODEL ? null : "EVAL_MODEL or OPENAI_MODEL",
      ]
    : [
        process.env.ANTHROPIC_API_KEY ? null : "ANTHROPIC_API_KEY",
        process.env.EVAL_MODEL || process.env.ANTHROPIC_MODEL
          ? null
          : "EVAL_MODEL or ANTHROPIC_MODEL",
      ];

const missingMessages = missing.filter(Boolean);

if (missingMessages.length > 0) {
  console.error(`Missing required environment variable(s): ${missingMessages.join(", ")}`);
  console.error("");
  console.error("Example:");
  console.error(
    provider === "openai"
      ? "  EVAL_PROVIDER=openai OPENAI_API_KEY=... EVAL_MODEL=your-model-name pnpm eval:llm"
      : "  EVAL_PROVIDER=anthropic ANTHROPIC_API_KEY=... EVAL_MODEL=your-model-name pnpm eval:llm",
  );
  process.exitCode = 1;
}
