import { signIn } from "@/auth";

import Image from "next/image";

export default function SignIn() {
  return (
    <div className="grid items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main>
        <Image
          src="/SchedOwl logo.svg"
          alt="SchedOwl logo"
          width={48}
          height={48}
        />
        <h1 className="text-3xl font-semibold text-[#101828]">
          Welcome to SchedOwl
        </h1>
        <h2 className="text-[#475467]">Start your 30-day free trial.</h2>
        <form className="flex flex-col gap-4">
          <input type="email" name="email" id="email" />
          <button
            className="bg-[#1570EF] w-full h-full text-white font-semibold py-2.5 border-2 rounded-lg shadow-[0px_1px_2px_0px_#1018280D,0px_-2px_0px_0px_#1018280D_inset,0px_0px_0px_1px_#1018282E_inset]"
            style={{
              border: "2px solid",
              borderImageSource:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%)",
            }}
          >
            Get started
          </button>
          <div className="flex items-center">
            <hr className="flex-grow border-t border-gray-300" />
            <span className="mx-4 text-[#E4E7EC">OR</span>
            <hr className="flex-grow border-t border-gray-300" />
          </div>
        </form>
        <form
          className="flex flex-col gap-4"
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button
            className="bg-white text-[#344054] w-full h-full text-white font-semibold py-2.5 border-2 rounded-lg shadow-[0px_1px_2px_0px_#1018280D,0px_-2px_0px_0px_#1018280D_inset,0px_0px_0px_1px_#1018282E_inset] flex items-center justify-center gap-2"
            style={{
              border: "2px solid",
              borderImageSource:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%)",
            }}
            type="submit"
          >
            <Image
              src="/google-icon.svg"
              alt="Google icon"
              width={20}
              height={20}
            />
            Continue with Google
          </button>
        </form>
      </main>
    </div>
  );
}
