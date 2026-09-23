import {
  AuthBrandPanel,
} from "../components/auth/AuthBrandPanel";

import {
  RegisterForm,
} from "../components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#F0EDEE] p-4 md:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[28px] border border-[#D6DEDE] bg-white shadow-[0_30px_80px_rgba(7,57,60,0.14)] md:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.08fr_0.92fr]">
        <AuthBrandPanel />

        <section className="relative flex items-center justify-center px-5 py-8 sm:px-10 lg:px-14">
          <RegisterForm />
        </section>
      </div>
    </main>
  );
}