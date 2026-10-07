import { LoginForm } from "@/components/Forms";
export default function Login() {
  return <main className="mx-auto flex min-h-screen max-w-md items-center px-4"><div className="card w-full">
    <p className="text-sm font-semibold text-iris">HostelOS</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome back</h1>
    <p className="mb-5 mt-1 text-sm text-ink/60">Sign in to manage your hostel.</p><LoginForm />
    <p className="mt-4 text-xs text-ink/50">Demo: student1@demo.edu, warden1@demo.edu, staff1@demo.edu, admin@demo.edu · Demo@1234</p></div></main>;
}
