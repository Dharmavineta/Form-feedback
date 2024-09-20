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
    <header>
      <div className="flex h-14 justify-between items-center px-10">
        <div>
          <h3>LOGO</h3>
        </div>
        <div>
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
