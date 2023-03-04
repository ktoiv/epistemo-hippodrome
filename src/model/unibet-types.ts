export type UnibetEvent = {
    event: Event
    betOffers: BetOffer[]
}

export type Event = {
    id: number
    name: string
    group: string
    groupId: number
}

export type BetOffer = {
    id: number
    eventId: number
    outcomes: Outcome[]

}

export type Outcome = {
    id: number
    label: string
    startNro: number
    odds: number
}