#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";

const requested = process.argv[2];

if (!requested) {
  console.error("Usage: node scripts/validate.mjs <campaign-directory>");
  process.exit(1);
}

const campaignDir = path.resolve(process.cwd(), requested);
const errors = [];

const TERMOS_BANIDOS = [
  "garantido", "garantida", "garantia de retorno", "sem risco", "lucro certo",
  "renda garantida", "certeza de resultado", "domine em", "dobre seu salário",
  "aumento de salário", "emprego garantido",
];

const RE_HORA = /^\d{2}:\d{2}$/;

async function readJson(filename) {
  const file = path.join(campaignDir, filename);
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    errors.push(`${filename}: ${error.message}`);
    return null;
  }
}

const [sequence, rules, factPack] = await Promise.all([
  readJson("sequence.json"),
  readJson("compliance-rules.json"),
  readJson("fact-pack.json"),
]);

// v2.0.0 — marketing campaign contract (optional campaign.json in the
// directory). Deterministic: same input, same verdict. Fields follow
// motores/src/mail-mkt/cadencia.ts (CampanhaDeMarketing) and the copy floor
// follows nucleo/src/piso.ts (TERMOS_BANIDOS port).
await validarCampanhaDeMarketing();

try {
  const intake = await readFile(path.join(campaignDir, "intake.md"), "utf8");
  if (/<[^>]+>/.test(intake)) errors.push("intake.md: unresolved placeholders remain");
} catch (error) {
  errors.push(`intake.md: ${error.message}`);
}

if (!sequence || !rules || !factPack) finish();

const expected = [
  ["drip_0", 0, "lesson"],
  ["drip_1", 1, "letter"],
  ["drip_3", 3, "lesson"],
  ["drip_5", 5, "echo"],
  ["drip_7", 7, "lesson"],
  ["drip_9", 9, "letter"],
  ["drip_12", 12, "echo"],
  ["drip_14", 14, "lesson"],
  ["drip_18", 18, "letter"],
  ["drip_25", 25, "echo"],
];

if (rules.subjectMaxCharacters === undefined) {
  errors.push("compliance-rules.json: subjectMaxCharacters ausente — checagem de tamanho não pode desligar silenciosamente");
}
const factIds = new Set((factPack.facts ?? []).map((fact) => fact.id));
const banned = (rules.bannedPhrases ?? []).map((phrase) => phrase.toLocaleLowerCase());
const bannedSubjectWords = (rules.bannedSubjectWords ?? []).map((word) => word.toLocaleLowerCase());
const requiredPostscripts = new Set(rules.requirePostscriptFor ?? []);
const requireNamePersonalizationFor = new Set(rules.requireNamePersonalizationFor ?? []);
const personalizationToken = "{{lead.firstName}}";
// Representative first-name length for subject-length checks. The literal token is
// longer than any real rendered name would be, so counting it verbatim would make
// personalization mathematically impossible under a mobile subject limit.
const personalizationPlaceholder = "Alex";
const seen = new Set();

for (const field of ["name", "segment", "bigIdea", "offer"]) {
  const value = sequence.campaign?.[field];
  if (!value || /<[^>]+>/.test(value)) errors.push(`campaign.${field}: missing or unresolved`);
}

if (!Array.isArray(sequence.steps) || sequence.steps.length !== expected.length) {
  errors.push(`sequence.json: expected ${expected.length} steps`);
} else {
  for (let index = 0; index < expected.length; index += 1) {
    const step = sequence.steps[index];
    const [expectedId, expectedDay, expectedFormat] = expected[index];
    const prefix = `steps[${index}]`;

    if (step.id !== expectedId) errors.push(`${prefix}.id: expected ${expectedId}`);
    if (step.day !== expectedDay) errors.push(`${prefix}.day: expected ${expectedDay}`);
    if (step.format !== expectedFormat) errors.push(`${prefix}.format: expected ${expectedFormat}`);
    if (seen.has(step.id)) errors.push(`${prefix}.id: duplicate ${step.id}`);
    seen.add(step.id);

    for (const field of ["subject", "preheader", "body", "ctaLabel", "ctaUrl"]) {
      const value = step[field];
      if (!value || /<[^>]+>/.test(value)) errors.push(`${prefix}.${field}: missing or unresolved`);
    }

    const renderedSubject = (step.subject ?? "").replaceAll(personalizationToken, personalizationPlaceholder);
    if (Array.from(renderedSubject).length > rules.subjectMaxCharacters) {
      errors.push(`${prefix}.subject: exceeds ${rules.subjectMaxCharacters} characters (rendered with a sample name)`);
    }

    const subjectLower = (step.subject ?? "").toLocaleLowerCase();
    const ctaLabelLower = (step.ctaLabel ?? "").toLocaleLowerCase();
    for (const word of bannedSubjectWords) {
      if (subjectLower.includes(word)) errors.push(`${prefix}.subject: contains spam-trigger word "${word}"`);
      if (ctaLabelLower.includes(word)) errors.push(`${prefix}.ctaLabel: contains generic/spam-trigger word "${word}" — express the benefit instead`);
    }

    if (requireNamePersonalizationFor.has(step.id) && !(step.subject ?? "").includes(personalizationToken)) {
      errors.push(`${prefix}.subject: must include ${personalizationToken} for this step`);
    }

    if (rules.requireHttpsCta && !/^https:\/\//i.test(step.ctaUrl ?? "")) {
      errors.push(`${prefix}.ctaUrl: must use HTTPS`);
    }

    if (requiredPostscripts.has(step.format) && !step.postscript) {
      errors.push(`${prefix}.postscript: required for ${step.format}`);
    }

    const copy = [step.subject, step.preheader, step.body, step.ctaLabel, step.postscript]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();

    for (const phrase of banned) {
      if (copy.includes(phrase)) errors.push(`${prefix}: contains banned phrase "${phrase}"`);
    }

    const referencedFacts = step.factIds ?? [];
    for (const factId of referencedFacts) {
      if (!factIds.has(factId)) errors.push(`${prefix}.factIds: unknown ${factId}`);
    }

    if (rules.requireFactIdForNumbers && /\d/.test(copy) && referencedFacts.length === 0) {
      errors.push(`${prefix}.factIds: copy contains a number but references no fact`);
    }
  }
}

validateResends();
finish();

function validateResends() {
  const resends = sequence?.resends;
  if (resends === undefined) return;
  if (!Array.isArray(resends)) {
    errors.push("sequence.resends: must be an array when present");
    return;
  }

  const stepIds = new Set((sequence.steps ?? []).map((step) => step.id));
  const resendIds = new Set();

  resends.forEach((resend, index) => {
    const prefix = `resends[${index}]`;

    if (!resend.id || resendIds.has(resend.id) || stepIds.has(resend.id)) {
      errors.push(`${prefix}.id: missing, duplicate, or collides with a step id`);
    }
    resendIds.add(resend.id);

    if (!stepIds.has(resend.resendOf)) {
      errors.push(`${prefix}.resendOf: must reference an existing step id, got "${resend.resendOf}"`);
    }

    if (!Number.isInteger(resend.afterDays) || resend.afterDays <= 0) {
      errors.push(`${prefix}.afterDays: must be a positive integer`);
    }

    const subject = resend.subject;
    if (!subject || /<[^>]+>/.test(subject)) {
      errors.push(`${prefix}.subject: missing or unresolved`);
      return;
    }

    const originalStep = (sequence.steps ?? []).find((step) => step.id === resend.resendOf);
    if (originalStep && subject.toLocaleLowerCase() === (originalStep.subject ?? "").toLocaleLowerCase()) {
      errors.push(`${prefix}.subject: must be reformulated, not identical to the original step's subject`);
    }

    const rendered = subject.replaceAll(personalizationToken, personalizationPlaceholder);
    if (Array.from(rendered).length > rules.subjectMaxCharacters) {
      errors.push(`${prefix}.subject: exceeds ${rules.subjectMaxCharacters} characters (rendered with a sample name)`);
    }

    const subjectLower = subject.toLocaleLowerCase();
    for (const word of bannedSubjectWords) {
      if (subjectLower.includes(word)) errors.push(`${prefix}.subject: contains spam-trigger word "${word}"`);
    }
    for (const phrase of banned) {
      if (subjectLower.includes(phrase)) errors.push(`${prefix}.subject: contains banned phrase "${phrase}"`);
    }
    if (requireNamePersonalizationFor.has(resend.id) && !subject.includes(personalizationToken)) {
      errors.push(`${prefix}.subject: must include ${personalizationToken} for this step`);
    }
  });
}

function ehHoraValida(v) {
  if (typeof v !== "string" || !RE_HORA.test(v)) return false;
  const [h, m] = v.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

async function validarCampanhaDeMarketing() {
  const file = path.join(campaignDir, "campaign.json");
  let campanha;
  try {
    campanha = JSON.parse(await readFile(file, "utf8"));
  } catch {
    return; // campaign.json is optional — v1.1.1 directories stay valid
  }

  const camposObrigatorios = ["slug", "name", "offerName", "offerUrl", "status", "cadence", "sendHour"];
  for (const campo of camposObrigatorios) {
    if (typeof campanha[campo] !== "string" || campanha[campo].trim() === "") {
      errors.push(`campaign.json: campo obrigatório ausente ou vazio: ${campo}`);
    }
  }
  if (campanha.status && !["active", "paused", "completed"].includes(campanha.status)) {
    errors.push(`campaign.json: status inválido "${campanha.status}" (active|paused|completed)`);
  }
  if (campanha.cadence && !["hourly", "daily", "weekly"].includes(campanha.cadence)) {
    errors.push(`campaign.json: cadence inválida "${campanha.cadence}" (hourly|daily|weekly)`);
  }
  if (campanha.offerUrl && !/^https:\/\//.test(campanha.offerUrl)) {
    errors.push(`campaign.json: offerUrl deve começar com https://`);
  }
  if (campanha.sendHour && !ehHoraValida(campanha.sendHour)) {
    errors.push(`campaign.json: sendHour inválido "${campanha.sendHour}" (esperado HH:MM)`);
  }
  if (campanha.weekdays !== undefined) {
    const ok = Array.isArray(campanha.weekdays)
      && campanha.weekdays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    if (!ok) errors.push("campaign.json: weekdays deve ser array de inteiros 0-6");
  }
  if (campanha.intervalDays !== undefined
      && (!Number.isInteger(campanha.intervalDays) || campanha.intervalDays < 1)) {
    errors.push("campaign.json: intervalDays deve ser inteiro >= 1");
  }

  // Copy floor — same gate that runs on save AND send in the engine.
  const subject = typeof campanha.copy?.subject === "string" ? campanha.copy.subject : "";
  const corpo = typeof campanha.copy?.corpo === "string" ? campanha.copy.corpo : "";
  if (subject.trim() === "") errors.push("campaign.json: copy.subject vazio");
  const texto = `${subject}\n${corpo}`.toLowerCase();
  for (const termo of TERMOS_BANIDOS) {
    if (texto.includes(termo)) errors.push(`campaign.json: copy contém termo banido "${termo}"`);
  }
}

function finish() {
  if (errors.length > 0) {
    console.error(`Campaign validation failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`Campaign validation passed: ${campaignDir}`);
}
