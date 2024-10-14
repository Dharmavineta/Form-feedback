import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "./ui/button";
import { MenuButton } from "@/app/(user)/dashboard/_components/dash-menu-button";
import Link from "next/link";

export const PageHeader = () => {
  return (
    <header className="border-b">
      <div className="flex h-14 justify-between items-center px-10">
        <div className="flex items-center">
          <MenuButton />
          <Link href={"/"}>
            <h3 className="text-purple-500 font-semibold">Clean-Forms</h3>
          </Link>
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
