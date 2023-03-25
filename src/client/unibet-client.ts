import axios, { AxiosResponse } from "axios"
import NodeCache from "node-cache"
import { BetOffer, Outcome, UnibetEvent } from "../model/unibet-types"

const UNIBET_BASE_URL = process.env.UNIBET_URL || ''

const UNIBET_CACHE = new NodeCache({
    useClones: false,
    stdTTL: 300
})

const UNIBET_CACHE_KEYS = {
    EVENT_DATA: 'events',
    START_PREFIX: 'start'
}

const EMPTY_UNIBET_EVENT: UnibetEvent =  {
    event: {
        name: '',
        group: '',
        groupId: -1,
        id: -1
    },
    betOffers: [
        {id: -1, eventId: -1, outcomes: []}
    ]
}


const fetchUnibetOdds = async(track: string, start: number): Promise<Outcome[]> => {

    const cacheKey: string = computeCacheKey(track, start) 
    
    if (UNIBET_CACHE.has(cacheKey)) {
        return UNIBET_CACHE.get(cacheKey)!
    }

    try {
        const eventsWithBetOffers: UnibetEvent[] = await fetchUnibetData()
        const outcomes: Outcome[] = findOddsForTrackAndStart(track, start, eventsWithBetOffers)

        return outcomes
    } catch (error) {
        console.log("Could not find cards for today, returning empty list", 'REASON:', error)
        return []
    }
}

const fetchUnibetData = async (): Promise<UnibetEvent[]> => {

    if (UNIBET_CACHE.has(UNIBET_CACHE_KEYS.EVENT_DATA)) {
        return UNIBET_CACHE.get(UNIBET_CACHE_KEYS.EVENT_DATA)!
    }

    const response: AxiosResponse = await axios.get(UNIBET_BASE_URL)
    const allEvents: UnibetEvent[] = response.data.events;
    const eventsWithBetOffers = allEvents.filter((event: UnibetEvent) => event.betOffers && event.betOffers.length > 0)

    UNIBET_CACHE.set(UNIBET_CACHE_KEYS.EVENT_DATA, eventsWithBetOffers)

    return eventsWithBetOffers;
}

const findOddsForTrackAndStart = (track: string, start: number, events: UnibetEvent[]): Outcome[] => {
    const correctEvent: UnibetEvent = events.find((unibetEvent: UnibetEvent) => {
        const trackAndStartString = unibetEvent.event.name.split('–')[1]
        const parts = trackAndStartString.split('#')
        const trackName = parts[0].trim()
        const startNumberString = parts[1].trim()

        return trackName.toLowerCase() === track.toLowerCase() && parseInt(startNumberString) === start
    }) || EMPTY_UNIBET_EVENT

    const betOffer: BetOffer = correctEvent.betOffers[0]
    const outcomes: Outcome[] = betOffer.outcomes

    UNIBET_CACHE.set(computeCacheKey(track, start), outcomes)
    return outcomes
}


const computeCacheKey = (track: string, start: number): string => `${track.toLowerCase()}-${start}` 

export const UnibetClient = {
    fetchUnibetOdds
}