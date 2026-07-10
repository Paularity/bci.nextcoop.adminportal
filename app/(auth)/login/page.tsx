import { Boxes } from "lucide-react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div
      className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm"
      style={{ border: "1px solid var(--card-border)" }}
    >
      <div className="mb-8 flex flex-col items-center gap-3">
        <div
          className="flex size-14 items-center justify-center rounded-md"
          style={{ background: "#1e1e1e" }}
        >
          <Boxes className="size-7" style={{ color: "var(--brand-primary)" }} />
        </div>
        <h1 className="text-lg font-semibold text-slate-900">NextCoop Admin Portal</h1>
      </div>
      <h2 className="mb-5 text-base font-semibold text-slate-900">Login</h2>
      <LoginForm />
    </div>
  );
}
