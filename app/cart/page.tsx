import { ROUTES } from "@/constants/site";
import { redirect } from "next/navigation";

export default async function CartPage() {
  redirect(ROUTES.menu);
}
