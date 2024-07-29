import { Context, Hono } from 'hono'
import { sha1 } from 'hono/utils/crypto'
import { z } from 'zod'

import { B2EventRequest } from './b2'
import { App } from './types'

const app = new Hono<App>()
	.use('*', async (c, next) => {
		await next()
		console.log(c.res.status)
	})

	.onError(async (err: Error, c: Context<App>): Promise<Response> => {
		console.error(err)
		return c.text('internal server error', 500)
	})

	// Routes
	.post('/notify', async (c) => {
		const bodyText = await c.req.text()
		const body = B2EventRequest.parse(JSON.parse(bodyText))

		const b2SigningSecret = z
			.string()
			.min(1)
			.describe('b2 signing secret')
			.parse(c.env.B2_SIGNING_SECRET)

		const sigHeader = z
			.string()
			.min(1)
			.describe('b2 signature')
			.parse(c.req.header('X-Bz-Event-Notification-Signature'))

		const [version, sig] = z
			.tuple([z.string().min(1), z.string().min(1)])
			.parse(sigHeader.split('='))

		if (body.events.some((e) => e.eventType !== 'b2:TestEvent')) {
			if (version !== 'v1') {
				return c.text('bad version', 400)
			}

			const alg: SubtleCryptoImportKeyAlgorithm = { name: 'HMAC', hash: 'SHA-256' }
			const encoder = new TextEncoder()

			const key = await crypto.subtle.importKey(
				'raw',
				encoder.encode(b2SigningSecret),
				alg,
				false,
				['verify']
			)

			const valid = await crypto.subtle.verify(
				alg.name,
				key,
				hexToBuffer(sig),
				encoder.encode(bodyText)
			)

			if (!valid) {
				return c.text('bad signature', 400)
			}
		}

		// Can only record 25 stats per request to Workers Analytics Engine.
		// Right now, B2 only sends 1 event per request so this should be fine.
		const eventsToRecord = body.events.filter((e) => e.objectSize !== null).slice(0, 25)
		for (const event of eventsToRecord) {
			const idx = z
				.string()
				.min(1)
				.parse(await sha1(event.accountId + event.bucketId + event.eventType))

			c.env.B2_EVENTS.writeDataPoint({
				blobs: [
					event.accountId, // blob1
					event.bucketId, // blob2
					event.bucketName, // blob3
				],
				doubles: [
					// Should not be null due to filter above
					event.objectSize ?? 0, // double1
				],
				indexes: [idx],
			})
		}

		return c.text('ok')
	})

function hexToBuffer(hex: string) {
	const matches = hex.match(/[\da-f]{2}/gi) ?? []
	const typedArray = new Uint8Array(
		matches.map(function (h) {
			return parseInt(h, 16)
		})
	)
	return typedArray.buffer
}

export default app
