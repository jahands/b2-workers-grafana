import { zValidator } from '@hono/zod-validator'
import { Context, Hono, Next } from 'hono'
import { sha1 } from 'hono/utils/crypto'
import { z } from 'zod'

import { B2Event, B2EventRequest, useValidateB2EventSignature } from './b2'
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
	.post('/notify', useValidateB2EventSignature, zValidator('json', B2EventRequest), async (c) => {
		const { events } = c.req.valid('json')

		// Can only record 25 stats per request to Workers Analytics Engine.
		// Right now, B2 only sends 1 event per request so this should be fine.
		const eventsToRecord = events.filter((e) => e.objectSize !== null).slice(0, 25)
		for (const event of eventsToRecord) {
			const idx = z
				.string()
				.min(1)
				.parse(await sha1(event.accountId + event.bucketId + event.bucketName))

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

export default app
