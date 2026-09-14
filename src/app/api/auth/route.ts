import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticate,
  createSession,
  hashPassword,
  setSessionCookie,
  clearSessionCookie,
  getSession,
} from "@/lib/auth";
import { createUser, findUserByEmail } from "@/lib/store";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({ user: session });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === "login") {
      const { email, password } = z
        .object({ email: z.string().email(), password: z.string().min(6) })
        .parse(body);
      const user = await authenticate(email, password);
      if (!user) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }
      const token = await createSession(user);
      await setSessionCookie(token);
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    }

    if (action === "register") {
      const { email, password, name } = z
        .object({
          email: z.string().email(),
          password: z.string().min(6),
          name: z.string().min(2),
        })
        .parse(body);
      if (await findUserByEmail(email)) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 400 }
        );
      }
      const user = await createUser({
        email,
        name,
        passwordHash: await hashPassword(password),
        role: "customer",
      });
      const token = await createSession(user);
      await setSessionCookie(token);
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    }

    if (action === "logout") {
      await clearSessionCookie();
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Auth failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
