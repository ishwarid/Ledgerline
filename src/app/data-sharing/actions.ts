"use server";

import { revalidatePath } from "next/cache";
import { getDataSource } from "@/lib/cdr/source";
import { getRevokedConsentIds, setRevokedConsentIds } from "@/lib/consent-store";

export type ActionResult = { ok: true } | { ok: false; message: string };

export async function stopSharing(consentId: string): Promise<ActionResult> {
  // Server actions are public endpoints, so check the ID is one we know
  // about instead of trusting whatever the client sent.
  const consents = await getDataSource().getConsents();
  if (!consents.some((c) => c.consentId === consentId)) {
    return { ok: false, message: "That data sharing arrangement no longer exists." };
  }

  const revoked = await getRevokedConsentIds();
  revoked.add(consentId);
  await setRevokedConsentIds(revoked);

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function resetDemo(): Promise<void> {
  await setRevokedConsentIds(new Set());
  revalidatePath("/", "layout");
}
