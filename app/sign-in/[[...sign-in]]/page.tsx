"use client";

import AuthForm from "@/components/ui/AuthForm";

export default function SignInPage() {
  return (
    // <div className="h-screen flex items-start justify-center mt-10">
    //   <SignIn.Root>
    //     <SignIn.Step
    //       name="start"
    //       className="bg-gray-200 p-6 rounded-2xl shadow-2xl flex flex-col gap-4 max-w-md w-full"
    //     >
    //       <h1 className="font-bold text-center text-base">
    //         Sign in to your account
    //       </h1>

    //       <Clerk.Connection
    //         name="google"
    //         className="flex justify-center items-center gap-3 rounded-lg p-2 bg-white shadow-md text-sm font-medium text-black"
    //       >
    //         <Image
    //           src={"/google.svg"}
    //           width={40}
    //           height={40}
    //           alt="google"
    //           className="w-6 h-6"
    //         />{" "}
    //         Continue with google
    //       </Clerk.Connection>

    //       <Clerk.Field name="identifier">
    //         <Clerk.Label>Email</Clerk.Label>
    //         <Clerk.Input />
    //         <Clerk.FieldError />
    //       </Clerk.Field>
    //       <Clerk.Field name="password">
    //         <Clerk.Label>Password</Clerk.Label>
    //         <Clerk.Input />
    //         <Clerk.FieldError />
    //       </Clerk.Field>

    //       <SignIn.Action submit>Continue</SignIn.Action>
    //     </SignIn.Step>

    //     {/* <SignIn.Strategy name="password">
    //       <h1>Enter your password</h1>

    //       <SignIn.Action submit>Continue</SignIn.Action>
    //       <SignIn.Action navigate="forgot-password">
    //         Forgot password?
    //       </SignIn.Action>
    //     </SignIn.Strategy> */}
    //   </SignIn.Root>
    // </div>
    <AuthForm type="login" />
  );
}
