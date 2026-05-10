"use node"

import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import crypto from "node:crypto";

const KEK = process.env.MASTER_KEY!;

export const encryptEnvVariable = internalAction({
	args: {
		value: v.string()
	},
	handler: (_, args) => {
		const DEK = crypto.randomBytes(32);

		const dataIv = crypto.randomBytes(12);
		const cipher = crypto.createCipheriv("aes-256-gcm", DEK, dataIv);

		const ciphertext = Buffer.concat([
			cipher.update(args.value, "utf8"),
			cipher.final(),
		]);

		const dataTag = cipher.getAuthTag();

		const wrapIv = crypto.randomBytes(12);
		const wrapCipher = crypto.createCipheriv("aes-256-gcm", KEK, wrapIv);

		const wrappedKey = Buffer.concat([
			wrapCipher.update(DEK),
			wrapCipher.final(),
		]);

		const wrapTag = wrapCipher.getAuthTag();

		return {
			alg: "AES-256-GCM",
			wrappedKey: wrappedKey.toString("base64"),
			wrapIv: wrapIv.toString("base64"),
			wrapTag: wrapTag.toString("base64"),
			ciphertext: ciphertext.toString("base64"),
			dataIv: dataIv.toString("base64"),
			dataTag: dataTag.toString("base64"),
		};
	}
});

export const decryptEnvVariable = internalAction({
	args: {
		envelope: v.object({
			wrappedKey: v.string(),
			wrapIv: v.string(),
			wrapTag: v.string(),
			ciphertext: v.string(),
			dataIv: v.string(),
			dataTag: v.string(),
		})
	},
	handler: (_, { envelope }) => {
		const wrappedKey = Buffer.from(envelope.wrappedKey, "base64");
		const wrapIv = Buffer.from(envelope.wrapIv, "base64");
		const wrapTag = Buffer.from(envelope.wrapTag, "base64");

		const unwrapCipher = crypto.createDecipheriv(
			"aes-256-gcm",
			KEK,
			wrapIv
		);

		unwrapCipher.setAuthTag(wrapTag);

		const DEK = Buffer.concat([
			unwrapCipher.update(wrappedKey),
			unwrapCipher.final(),
		]);

		const ciphertext = Buffer.from(envelope.ciphertext, "base64");
		const dataIv = Buffer.from(envelope.dataIv, "base64");
		const dataTag = Buffer.from(envelope.dataTag, "base64");

		const decipher = crypto.createDecipheriv(
			"aes-256-gcm",
			DEK,
			dataIv
		);

		decipher.setAuthTag(dataTag);

		const plaintext = Buffer.concat([
			decipher.update(ciphertext),
			decipher.final(),
		]);

		return plaintext.toString("utf8");
	}
})
