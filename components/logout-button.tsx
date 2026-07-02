"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button variant="ghost" size="sm" type="submit">
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </form>
  );
}
