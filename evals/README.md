# Skill Evals

Evals are regression tests for the skills themselves. They answer two questions:

1. Would an agent select the right skill for a realistic request?
2. Once selected, does the skill give enough concise guidance to produce the right work?

This repo starts with the first layer because it is cheap and catches the most common failure mode: descriptions that are too broad, too narrow, or conflict with neighboring skills.

## What Runs Here

`pnpm eval` or `pnpm eval:static` runs deterministic checks:

- every `skills/*/SKILL.md` has valid frontmatter
- the `name` matches the directory
- descriptions stay within Agent Skill limits
- `SKILL.md` stays under the recommended 500-line budget
- local markdown links from `SKILL.md` resolve
- eval cases only reference skills that exist

`pnpm eval:llm` runs model-backed trigger evals through Evalite against `evals/skill-trigger-cases.json`.

`pnpm eval:dev` opens Evalite watch mode with the local UI for inspecting cases, outputs, traces, and scorer metadata.

Each case has:

- `query`: a realistic user request
- `expectedSkills`: skills that should trigger
- `forbiddenSkills`: skills that must not trigger
- `notes`: why the case exists

## Running Trigger Evals

The runner does not hardcode a model. Set the provider and model you want to qualify.

Anthropic:

```bash
EVAL_PROVIDER=anthropic \
ANTHROPIC_API_KEY=... \
EVAL_MODEL=your-model-name \
pnpm eval:llm
```

OpenAI or OpenAI-compatible chat completions:

```bash
EVAL_PROVIDER=openai \
OPENAI_API_KEY=... \
EVAL_MODEL=your-model-name \
pnpm eval:llm
```

Optional variables:

```bash
ANTHROPIC_VERSION=2023-06-01
OPENAI_BASE_URL=https://api.openai.com/v1
```

Run the same suite against every model or agent surface you intend to use. A skill that selects correctly on a stronger model may need a sharper description for a smaller one.

Use `pnpm eval:dev` with the same env vars to open the Evalite UI.

## Adding Cases

Add 3-5 cases per skill at minimum:

- positive cases where the skill should trigger
- negative cases where nearby skills should not trigger
- ambiguous/coexistence cases where multiple skills should trigger together

Prefer realistic prompts from actual work. Avoid toy prompts that only repeat the skill name, because they do not test discovery.

## Next Layer

Trigger evals only test routing. For output quality, add task evals that run the agent with the selected skill and grade the answer or patch against a rubric. Good follow-up dimensions are:

- selected the correct reference file
- avoided an explicitly forbidden API or pattern
- produced code matching project conventions
- included the verification step required by the skill

Keep these task evals small. One high-signal scenario per fragile behavior is better than a large brittle benchmark.
