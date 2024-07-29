export type Bindings = {
	B2_EVENTS: AnalyticsEngineDataset
	B2_SIGNING_SECRET: string
}

export type Variables = undefined

export interface App {
	Bindings: Bindings
	Variables: Variables
}
