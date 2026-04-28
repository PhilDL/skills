import { defineConfig } from "evalite/config";

export default defineConfig({
  testTimeout: 60_000,
  forceRerunTriggers: [
    "skills/**/SKILL.md",
    "evals/skill-trigger-cases.json",
    "evals/skill-routing.ts",
  ],
});
