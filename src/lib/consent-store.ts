import "server-only";

import { cookies } from "next/headers";

/*
 * In a real CDR app, revoking a consent is a call to the data holder's
 * revocation endpoint and the record lives in a database. For the demo we
 * keep revoked consent IDs in a cookie: each visitor gets their own state,
 * nothing is shared between recruiters clicking around, and it works on
 * serverless hosting with no database.
 */
const COOKIE = "ll-revoked-consents";

export async function getRevokedConsentIds(): Promise<Set<string>> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value ?? "";
  return new Set(raw.split(",").filter(Boolean));
}

export async function setRevokedConsentIds(ids: Set<string>) {
  const jar = await cookies();
  if (ids.size === 0) {
    jar.delete(COOKIE);
    return;
  }
  jar.set(COOKIE, [...ids].join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
