"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Input, Checkbox } from "@progress/kendo-react-inputs";
import { Label } from "@progress/kendo-react-labels";
import { Button } from "@progress/kendo-react-buttons";
import { Loader } from "@progress/kendo-react-indicators";
import { User } from "lucide-react";
import { loginAction, type LoginActionState } from "@/actions/auth";
import { toast } from "@/shared/ui/toast/toast.store";

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [username, setUsername] = useState(state.values?.username ?? "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  useEffect(() => {
    if (state.values?.username != null) setUsername(state.values.username);
  }, [state.values?.username]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label editorId="username" className="text-xs text-slate-600">
          Email or Username
        </Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(String(e.value ?? ""))}
          valid={!state.fields?.username}
          required
        />
        {state.fields?.username && (
          <p className="text-xs text-red-600">{state.fields.username}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label editorId="password" className="text-xs text-slate-600">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(String(e.value ?? ""))}
          valid={!state.fields?.password}
          required
        />
        {state.fields?.password && (
          <p className="text-xs text-red-600">{state.fields.password}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Checkbox
          value={remember}
          onChange={(e) => setRemember(Boolean(e.value))}
          label="Remember me"
        />
        <Link
          href="#"
          className="text-sm font-semibold"
          style={{ color: "var(--brand-primary-hover)" }}
        >
          Forgot Password?
        </Link>
      </div>

      <Button
        type="submit"
        themeColor="primary"
        disabled={pending}
        className="w-full"
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Loader size="small" type="pulsing" /> Signing in...
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <User className="size-4" /> Log in
          </span>
        )}
      </Button>
    </form>
  );
}
