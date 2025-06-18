import { MultiStepSignUpForm } from "@/components/auth/multiStepSignUpForm";
import AuthForm from "@/components/ui/AuthForm";

export default function Page() {
  return (
    // <div className="max-w-screen-xl mx-auto mt-10 flex flex-col justify-center items-center">
    //   <SignUp />
    // </div>
    <AuthForm type="register" />
    // <MultiStepSignUpForm />
  );
}
