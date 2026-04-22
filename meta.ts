export interface SourceSkillMeta {
  source: string;
  skill?: string;
  skills?: string[];
}

export interface VendorSkillMeta {
  official?: boolean;
  source: string;
  skills: Record<string, string>; // sourceSkillName -> outputSkillName
}

/**
 * Repositories to clone as submodules and generate skills from source
 */
export const submodules: Record<string, string | SourceSkillMeta> = {
  odoo: {
    source: "https://github.com/odoo/documentation",
    skills: ["odoo-frontend", "odoo-backend"],
  },
  odootutorials: {
    source: "https://github.com/odoo/tutorials",
    skills: ["odoo-frontend"],
  }
};

/**
 * Already generated skills, sync with their `skills/` directory
 */
export const vendors: Record<string, VendorSkillMeta> = {};

/**
 * Hand-written skills with Philippe preferences/tastes/recommendations
 */
export const manual = ["phildl"];
