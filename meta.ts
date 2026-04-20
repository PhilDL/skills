export interface VendorSkillMeta {
  official?: boolean
  source: string
  skills: Record<string, string> // sourceSkillName -> outputSkillName
}

/**
 * Repositories to clone as submodules and generate skills from source
 */
export const submodules = {
  owl: 'https://github.com/odoo/owl',
}

/**
 * Already generated skills, sync with their `skills/` directory
 */
export const vendors: Record<string, VendorSkillMeta> = {

}

/**
 * Hand-written skills with Philippe preferences/tastes/recommendations
 */
export const manual = [
  'phildl',
]
