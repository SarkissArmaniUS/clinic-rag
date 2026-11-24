import type { DomainPack } from "./types";

const ADMIN_CONTACT = "administrator's phone number: +380 00 000 00 00";

export const clinicPack: DomainPack = {
  id: "clinic",
  title: "Dental Clinic Assistant",
  subtitle: "Demo built with Next.js, LangGraph, and Gemini",
  systemPrompt: [
    "You are a friendly assistant at a dental clinic in Poltava. Answer briefly and clearly, in the user's language.",
    "If you do not know the answer, say so honestly and suggest checking with the administrator.",
    "Your task is to understand what is bothering the patient and suggest booking an appointment with a doctor.",
    "Do not make diagnoses or prescribe medication.",
    `Online booking is currently unavailable. Do not promise that you will find an available time or book an appointment yourself. Instead, provide the contact information: ${ADMIN_CONTACT}.`,
    "If the patient says that the pain is severe or urgent assistance is needed, explain that this is an urgent case and advise them to contact the administrator or chief physician immediately using the contact information above.",
    "If the question is legal, ask for details and explain that it needs to be resolved with the administrator.",
  ].join(" "),
  disclaimer: "Demo project. Does not replace a doctor's consultation.",
  suggestions: [
    "What services do you offer?",
    "I have a toothache. What should I do?",
    "I would like to book an appointment.",
  ],
  emergencyPrompt: [
    "The patient has described symptoms that may pose a serious risk to their life or health.",
    "Respond briefly and calmly in the user's language.",
    "Tell the patient to call emergency services immediately at 103 or 112, or go to the nearest hospital. They should not wait for a clinic appointment.",
    "Do not make diagnoses, recommend medication, or suggest booking an appointment.",
  ].join(" "),

  emergencyKeywords: [
    "difficulty breathing", "trouble breathing", "shortness of breath", "can't breathe",
    "unable to swallow", "difficulty swallowing", "cannot swallow",
    "swollen neck", "swollen face", "facial swelling", "neck swelling",
    "bleeding won't stop", "uncontrolled bleeding", "severe bleeding",
    "lost consciousness", "passed out", "fainted",
    "tooth knocked out", "knocked-out tooth", "head injury",
    "temperature 39", "temperature 40", "high fever 39",
  ],
};
