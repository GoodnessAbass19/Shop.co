import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="max-w-screen-xl mx-auto mt-10 flex flex-col justify-center items-center">
      <SignUp />
    </div>
  );
}
