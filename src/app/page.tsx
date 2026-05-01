"use client";

import { Authenticated, Unauthenticated, useAction } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import React, { useState } from "react";
import { api } from "../../convex/_generated/api";

export default function Home() {
	return (
		<>
			<Authenticated>
				<UserButton />
				<Content />
			</Authenticated>
			<Unauthenticated>
				<SignInButton />
			</Unauthenticated>
		</>
	);
}

function Content() {
	const [token, setToken] = useState("Add Node");
	const tokenAction = useAction(api.nodes.actions.createRegistrationToken);

	const generateToken = async () => {
		const regToken = await tokenAction();
		setToken(regToken!);
	}

	return (
		<>
			<AddNodeButton text={token} onClick={generateToken} />
			<CopyButton text={token} />
		</>
	);
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
	return <button onClick={() => {
		navigator.clipboard.writeText(text)
	}} >Copy Token</button>
}

const AddNodeButton: React.FC<{ text: string, onClick: React.MouseEventHandler<HTMLButtonElement> }> = ({ text, onClick }) => {
	return <button onClick={onClick}>{text}</button>
}
