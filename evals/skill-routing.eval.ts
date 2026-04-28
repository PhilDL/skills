import { createScorer, evalite } from "evalite";
import {
  loadRoutingData,
  loadSkills,
  selectSkills,
  type SkillRoutingExpected,
  type SkillRoutingInput,
  type SkillRoutingOutput,
} from "./skill-routing";

const knownSkillNames = new Set(loadSkills().map((skill) => skill.name));

const skillRoutingAccuracy = createScorer<
  SkillRoutingInput,
  SkillRoutingOutput,
  SkillRoutingExpected
>({
  name: "Skill Routing Accuracy",
  description: "Checks expected skills, forbidden skills, unexpected extras, and unknown names.",
  scorer: ({ output, expected }) => {
    const actualSkills = output.skills.toSorted();
    const expectedSkills = expected.expectedSkills.toSorted();
    const allowedExtraSkills = new Set(expected.allowedExtraSkills);
    const forbiddenSkillNames = new Set(expected.forbiddenSkills);

    const missingSkills = expectedSkills.filter((skillName) => !actualSkills.includes(skillName));
    const forbiddenSkills = actualSkills.filter((skillName) => forbiddenSkillNames.has(skillName));
    const unexpectedSkills = actualSkills.filter(
      (skillName) => !expectedSkills.includes(skillName) && !allowedExtraSkills.has(skillName),
    );
    const unknownSkills = actualSkills.filter((skillName) => !knownSkillNames.has(skillName));

    const passed =
      missingSkills.length === 0 &&
      forbiddenSkills.length === 0 &&
      unexpectedSkills.length === 0 &&
      unknownSkills.length === 0;

    return {
      score: passed ? 1 : 0,
      metadata: {
        expectedSkills,
        actualSkills,
        missingSkills,
        forbiddenSkills,
        unexpectedSkills,
        unknownSkills,
        reason: output.reason,
      },
    };
  },
});

evalite<SkillRoutingInput, SkillRoutingOutput, SkillRoutingExpected>("Skill Routing", {
  data: loadRoutingData(),
  task: selectSkills,
  scorers: [skillRoutingAccuracy],
  columns: ({ input, output, expected, scores }) => [
    { label: "Case", value: input.id },
    { label: "Expected", value: expected?.expectedSkills.join(", ") ?? "" },
    { label: "Actual", value: output.skills.join(", ") },
    { label: "Score", value: scores[0]?.score ?? "" },
    { label: "Reason", value: output.reason },
  ],
});
