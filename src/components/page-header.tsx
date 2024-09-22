import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "./ui/button";

export const PageHeader = () => {
  return (
    <header className="border-b">
      <div className="flex h-14 justify-between items-center px-10">
        <div>
          <h3>LOGO</h3>
        </div>
        <div className="flex space-x-5">
          <SignedOut>
            <SignInButton>
              <Button variant={"outline"}>Login</Button>
            </SignInButton>
            <SignUpButton>
              <Button>Register</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
};
