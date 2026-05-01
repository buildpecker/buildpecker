"use node"
import Redis from "ioredis";

const redis = new Redis(
	parseInt(process.env.REDIS_PORT!),
	process.env.REDIS_HOST!,
	{
		lazyConnect: true,
		maxRetriesPerRequest: 3,
	}
);

export default redis;
