import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/rbac";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return <LoginForm />;
}
