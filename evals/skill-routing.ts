import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface Skill {
  name: string;
  description: string;
}

export interface SkillTriggerCase {
  id: string;
  query: string;
  expectedSkills: string[];
  forbiddenSkills?: string[];
  allowedExtraSkills?: string[];
  notes?: string;
}

export interface SkillRoutingInput {
  id: string;
  query: string;
  notes?: string;
}

export interface SkillRoutingExpected {
  expectedSkills: string[];
  forbiddenSkills: string[];
  allowedExtraSkills: string[];
}

export interface SkillRoutingOutput {
  skills: string[];
  reason: string;
  rawText?: string;
}

type EvalProvider = "anthropic" | "openai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const skillsRoot = join(root, "skills");
const evalCasesPath = join(root, "evals", "skill-trigger-cases.json");

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseSkillFrontmatter(content: string): Skill {
  if (!content.startsWith("---\n")) {
    throw new Error("SKILL.md is missing YAML frontmatter");
  }

  const end = content.indexOf("\n---", 4);
  if (end === -1) {
    throw new Error("SKILL.md has unterminated YAML frontmatter");
  }

  const data: Record<string, string> = {};
  const rawFrontmatter = content.slice(4, end);

  for (const line of rawFrontmatter.split("\n")) {
    if (!line.trim() || line.startsWith(" ")) continue;

    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) continue;

    const [, key, value] = match;
    if (key && value !== undefined && value.length > 0) {
      data[key] = stripQuotes(value);
    }
  }

  return {
    name: data.name ?? "",
    description: data.description ?? "",
  };
}

export function loadSkills(): Skill[] {
  if (!existsSync(skillsRoot)) return [];

  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const skillPath = join(skillsRoot, entry.name, "SKILL.md");
      if (!existsSync(skillPath)) {
        throw new Error(`Missing SKILL.md for ${entry.name}`);
      }

      return parseSkillFrontmatter(readFileSync(skillPath, "utf-8"));
    })
    .toSorted((a, b) => a.name.localeCompare(b.name));
}

export function loadTriggerCases(): SkillTriggerCase[] {
  return JSON.parse(readFileSync(evalCasesPath, "utf-8")) as SkillTriggerCase[];
}

export function loadRoutingData(): Array<{
  input: SkillRoutingInput;
  expected: SkillRoutingExpected;
}> {
  return loadTriggerCases().map((testCase) => ({
    input: {
      id: testCase.id,
      query: testCase.query,
      notes: testCase.notes,
    },
    expected: {
      expectedSkills: testCase.expectedSkills,
      forbiddenSkills: testCase.forbiddenSkills ?? [],
      allowedExtraSkills: testCase.allowedExtraSkills ?? [],
    },
  }));
}

export function skillCatalogPrompt(skills = loadSkills()): string {
  return skills.map((skill) => `- ${skill.name}: ${skill.description}`).join("\n");
}

function extractJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Model did not return a JSON object: ${text}`);
  }
  return JSON.parse(text.slice(start, end + 1));
}

function normalizeSkillList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").toSorted();
}

function getEvalProvider(): EvalProvider {
  const configured = process.env.EVAL_PROVIDER?.toLowerCase();
  if (configured === "anthropic" || configured === "openai") {
    return configured;
  }

  if (configured) {
    throw new Error(`Unsupported EVAL_PROVIDER "${configured}". Use "anthropic" or "openai".`);
  }

  if (process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    return "openai";
  }

  return "anthropic";
}

function skillSelectionPrompt(input: SkillRoutingInput): string {
  return `You are evaluating Agent Skill discovery. Select the skills that should be used for the user request. Do not answer the request.

Available skills:
${skillCatalogPrompt()}

Rules:
- Include a skill only when its description says it applies to the request.
- Include multiple skills when the request genuinely needs multiple domains.
- Exclude skills whose descriptions explicitly say not to use them for this request.
- Return only compact JSON with this schema: {"skills":["skill-name"],"reason":"short reason"}.

User request:
${input.query}`;
}

async function selectSkillsWithAnthropic(input: SkillRoutingInput): Promise<SkillRoutingOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.EVAL_MODEL ?? process.env.ANTHROPIC_MODEL;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required when EVAL_PROVIDER=anthropic");
  }
  if (!model) {
    throw new Error("EVAL_MODEL or ANTHROPIC_MODEL is required when EVAL_PROVIDER=anthropic");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": process.env.ANTHROPIC_VERSION ?? "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: skillSelectionPrompt(input),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API returned ${response.status}: ${body}`);
  }

  const json = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const rawText = json.content
    ?.map((part) => (part.type === "text" ? (part.text ?? "") : ""))
    .join("\n")
    .trim();

  if (!rawText) {
    throw new Error("Anthropic API response did not contain text");
  }

  const parsed = extractJsonObject(rawText) as { skills?: unknown; reason?: unknown };

  return {
    skills: normalizeSkillList(parsed.skills),
    reason: typeof parsed.reason === "string" ? parsed.reason : "",
    rawText,
  };
}

async function selectSkillsWithOpenAI(input: SkillRoutingInput): Promise<SkillRoutingOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.EVAL_MODEL ?? process.env.OPENAI_MODEL;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required when EVAL_PROVIDER=openai");
  }
  if (!model) {
    throw new Error("EVAL_MODEL or OPENAI_MODEL is required when EVAL_PROVIDER=openai");
  }

  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: skillSelectionPrompt(input) }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI-compatible API returned ${response.status}: ${body}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  const rawText =
    typeof content === "string"
      ? content.trim()
      : Array.isArray(content)
        ? content
            .map((part) =>
              typeof part === "object" && part !== null && "text" in part
                ? String(part.text)
                : "",
            )
            .join("\n")
            .trim()
        : "";

  if (!rawText) {
    throw new Error("OpenAI-compatible API response did not contain text");
  }

  const parsed = extractJsonObject(rawText) as { skills?: unknown; reason?: unknown };

  return {
    skills: normalizeSkillList(parsed.skills),
    reason: typeof parsed.reason === "string" ? parsed.reason : "",
    rawText,
  };
}

export async function selectSkills(input: SkillRoutingInput): Promise<SkillRoutingOutput> {
  const provider = getEvalProvider();
  return provider === "openai" ? selectSkillsWithOpenAI(input) : selectSkillsWithAnthropic(input);
}
