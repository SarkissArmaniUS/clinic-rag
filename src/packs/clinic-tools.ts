import { tool } from "@langchain/core/tools";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { z } from "zod";
import { getSupabase } from "@/core/supabase";

const TZ = "Europe/Kyiv";

const whenFormat = new Intl.DateTimeFormat("uk-UA", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
});
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });

const listDoctors = tool(
    async () => {
        const { data, error } = await getSupabase()
            .from("doctors")
            .select("id, name, specialty, treats")
            .order("id");
        if (error) {
            console.error("list_doctors error", error);
            return "Failed to get the list of doctors. Suggest contacting the administrator.";
        }
        return JSON.stringify(data);
    },
    {
        name: "list_doctors",
        description:
            "Returns the clinic's doctors: id, name, specialty, and what they treat. Use it to match a doctor to the patient's complaint.",
        schema: z.object({}),
    }
);

const getFreeSlots = tool(
    async ({ doctor_id }) => {
        const { data, error } = await getSupabase()
            .from("slots")
            .select("id, starts_at")
            .eq("doctor_id", doctor_id)
            .eq("is_booked", false)
            .gt("starts_at", new Date().toISOString())
            .order("starts_at")
            .limit(60);
        if (error) {
            console.error("get_free_slots error", error);
            return "Failed to get the schedule. Suggest contacting the administrator.";
        }
        if (!data?.length) return "This doctor has no available time in the coming days.";

        const perDay = new Map<string, number>();
        const picked: { slot_id: number; when: string }[] = [];
        for (const s of data) {
            const date = new Date(s.starts_at);
            const key = dayKey.format(date);
            const count = perDay.get(key) ?? 0;
            if (count >= 3) continue;
            perDay.set(key, count + 1);
            picked.push({ slot_id: s.id, when: whenFormat.format(date) });
            if (picked.length >= 9) break;
        }
        return JSON.stringify(picked);
    },
    {
        name: "get_free_slots",
        description:
            "Returns the doctor's nearest free slots (slot_id and time). doctor_id is taken from list_doctors.",
        schema: z.object({
            doctor_id: z.number().int().describe("Doctor ID from list_doctors"),
        }),
    }
);

const bookAppointment = tool(
    async ({ slot_id, patient_name, patient_phone }) => {
        const { data, error } = await getSupabase().rpc("book_slot", {
            p_slot_id: slot_id,
            p_name: patient_name.trim(),
            p_phone: patient_phone.trim(),
        });
        if (error) {
            console.error("book_appointment error", error);
            return "Failed to complete the booking. Suggest contacting the administrator.";
        }
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) {
            return "This time is already taken or unavailable. Offer the patient another time from get_free_slots.";
        }
        return JSON.stringify({
            status: "booked",
            appointment_id: row.out_appointment_id,
            doctor: row.out_doctor_name,
            when: whenFormat.format(new Date(row.out_starts_at)),
        });
    },
    {
        name: "book_appointment",
        description:
            "Books the patient for the chosen time. Call it ONLY after the patient has given their name and phone number and explicitly confirmed the doctor and time. Take slot_id from get_free_slots.",
        schema: z.object({
            slot_id: z.number().int().describe("slot_id from get_free_slots"),
            patient_name: z.string().min(2).max(80).describe("Patient's name"),
            patient_phone: z
                .string()
                .regex(/^\+?[0-9\s\-()]{9,18}$/, "Invalid phone number")
                .describe("Patient's phone number"),
        }),
    }
);

export const clinicTools: StructuredToolInterface[] = [
    listDoctors,
    getFreeSlots,
    bookAppointment,
];