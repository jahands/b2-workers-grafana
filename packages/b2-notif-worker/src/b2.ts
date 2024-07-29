import { Context, Next } from 'hono'
import { z } from 'zod'

export async function useValidateB2EventSignature(c: Context, next: Next): Promise<void> {
	const sig = z
		.string()
		.min(1)
		.describe('b2 signature')
		.parse(c.req.header('X-Bz-Event-Notification-Signature'))

	await next()
}

// https://www.backblaze.com/docs/cloud-storage-event-notifications-reference-guide#event-types
export type B2EventType = z.infer<typeof B2EventType>
export const B2EventType = z.enum([
	'b2:ObjectCreated:Upload',
	'b2:ObjectCreated:MultipartUpload',
	'b2:ObjectCreated:Copy',
	'b2:ObjectCreated:Replica',
	'b2:ObjectCreated:MultipartReplica',
	'b2:ObjectDeleted:Delete',
	'b2:ObjectDeleted:LifecycleRule',
	'b2:HideMarkerCreated:Hide',
	'b2:HideMarkerCreated:LifecycleRule',
])

export type B2Event = z.infer<typeof B2Event>
export const B2Event = z.object({
	accountId: z.string().min(1),
	bucketId: z.string().min(1),
	bucketName: z.string().min(1),
	eventId: z.string().min(1),
	eventTimestamp: z.number().min(1),
	eventType: B2EventType,
	eventVersion: z.literal(1),
	matchedRuleName: z.string().min(1),
	objectName: z.string().min(1),
	objectSize: z.number().nullable(),
	objectVersionId: z.string().min(1),
})

export type B2EventRequest = z.infer<typeof B2EventRequest>
export const B2EventRequest = z.object({
	events: z.array(B2Event),
})
