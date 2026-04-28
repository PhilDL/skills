import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const skillsRoot = join(root, "skills");
const evalCasesPath = join(root, "evals", "skill-trigger-cases.json");

const args = process.argv.slice(2);
const shouldPrintJson = args.includes("--json");

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatter(content) {
  if (!content.startsWith("---\n")) {
    throw new Error("missing YAML frontmatter");
  }

  const end = content.indexOf("\n---", 4);
  if (end === -1) {
    throw new Error("unterminated YAML frontmatter");
  }

  const data = {};
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
    data,
    body: content.slice(end + "\n---".length).replace(/^\n/, ""),
  };
}

function loadSkills() {
  if (!existsSync(skillsRoot)) return [];

  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dirName = entry.name;
      const dirPath = join(skillsRoot, dirName);
      const skillPath = join(dirPath, "SKILL.md");

      if (!existsSync(skillPath)) {
        return {
          dirName,
          dirPath,
          skillPath,
          name: "",
          description: "",
          body: "",
        };
      }

      const content = readFileSync(skillPath, "utf-8");
      const frontmatter = parseFrontmatter(content);

      return {
        dirName,
        dirPath,
        skillPath,
        name: frontmatter.data.name ?? "",
        description: frontmatter.data.description ?? "",
        body: frontmatter.body,
      };
    })
    .toSorted((a, b) => a.dirName.localeCompare(b.dirName));
}

function localMarkdownLinks(markdown) {
  const links = [];
  const regex = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const match of markdown.matchAll(regex)) {
    const target = match[1]?.trim();
    if (!target) continue;
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    if (target.startsWith("#")) continue;
    links.push(target);
  }

  return links;
}

function linkTargetExists(skill, target) {
  const withoutHash = target.split("#")[0] ?? "";
  const withoutTitle = withoutHash.split(/\s+["'][^"']*["']\s*$/)[0] ?? "";
  const normalized = normalize(join(skill.dirPath, withoutTitle));
  return existsSync(normalized);
}

function validateSkill(skill) {
  const results = [];

  results.push({
    ok: existsSync(skill.skillPath),
    label: `${skill.dirName}: SKILL.md exists`,
  });

  if (!existsSync(skill.skillPath)) return results;

  results.push({
    ok: skill.name === skill.dirName,
    label: `${skill.dirName}: frontmatter name matches directory`,
    details: skill.name ? `found ${skill.name}` : "missing name",
  });

  results.push({
    ok: /^[a-z0-9-]{1,64}$/.test(skill.name),
    label: `${skill.dirName}: name format is valid`,
    details: "lowercase letters, numbers, hyphens, max 64 chars",
  });

  results.push({
    ok: !/\b(?:anthropic|claude)\b/.test(skill.name),
    label: `${skill.dirName}: name avoids reserved words`,
    details: "reserved words: anthropic, claude",
  });

  results.push({
    ok:
      skill.description.length > 0 &&
      skill.description.length <= 1024 &&
      !/<\/?[A-Za-z][^>]*>/.test(skill.description),
    label: `${skill.dirName}: description is valid`,
    details: `${skill.description.length} chars`,
  });

  const bodyLineCount = skill.body.split("\n").length;
  results.push({
    ok: bodyLineCount <= 500,
    label: `${skill.dirName}: SKILL.md body stays under 500 lines`,
    details: `${bodyLineCount} lines`,
  });

  const brokenLinks = localMarkdownLinks(skill.body).filter(
    (target) => !linkTargetExists(skill, target),
  );
  results.push({
    ok: brokenLinks.length === 0,
    label: `${skill.dirName}: local markdown links resolve`,
    details: brokenLinks.join(", "),
  });

  return results;
}

function loadEvalCases() {
  const raw = readFileSync(evalCasesPath, "utf-8");
  return JSON.parse(raw);
}

function validateEvalCases(cases, skills) {
  const knownSkills = new Set(skills.map((skill) => skill.name));
  const results = [];

  for (const testCase of cases) {
    const referencedSkills = [
      ...testCase.expectedSkills,
      ...(testCase.forbiddenSkills ?? []),
      ...(testCase.allowedExtraSkills ?? []),
    ];

    const unknown = referencedSkills.filter((skillName) => !knownSkills.has(skillName));
    results.push({
      ok: unknown.length === 0,
      label: `${testCase.id}: referenced skills exist`,
      details: unknown.join(", "),
    });
  }

  return results;
}

function printCheckResults(results) {
  for (const result of results) {
    const status = result.ok ? "PASS" : "FAIL";
    const details = result.details ? ` (${result.details})` : "";
    console.log(`${status} ${result.label}${details}`);
  }
}

async function main() {
  const skills = loadSkills();
  const cases = loadEvalCases();
  const staticResults = [...skills.flatMap(validateSkill), ...validateEvalCases(cases, skills)];

  if (shouldPrintJson) {
    console.log(JSON.stringify({ staticResults }, null, 2));
  } else {
    console.log("Static checks");
    printCheckResults(staticResults);
    console.log("");
    console.log("LLM trigger evals live in Evalite. Run `pnpm eval:llm` or `pnpm eval:dev`.");
  }

  const failedStatic = staticResults.filter((result) => !result.ok);
  if (failedStatic.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
