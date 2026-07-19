import { logger } from '../../../logger.js';
import { skill as threeLittlePigs } from './three-little-pigs.js';

const skills = {};

export function registerSkill(skillDef) {
  skills[skillDef.name] = { ...skillDef };
}

export function listSkills() {
  return Object.values(skills).map(({ name, description }) => ({ name, description }));
}

export function loadSkill(name) {
  const skill = skills[name];
  if (!skill) {
    logger.warn({ skillName: name }, 'Skill not found');
    return null;
  }
  logger.info({ skillName: name }, 'Skill loaded');
  return skill.content;
}

registerSkill(threeLittlePigs);
