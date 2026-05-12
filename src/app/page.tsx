import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function RootIndex() {
	const { userId } = await auth();
	redirect(userId ? "/dashboard" : "/sign-in");
}
