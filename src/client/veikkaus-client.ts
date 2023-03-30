import axios, { AxiosResponse } from "axios"
import { Card, Odd, Pool, Race, Runner } from "../model/veikkaus-types"
import NodeCache from "node-cache"
import * as dotenv from 'dotenv'
dotenv.config()

const VEIKKAUS_BASE_URL = process.env.VEIKKAUS_URL || ''

const CARD_PATH = "cards/today"
const SWEDEN_COUNTRY_CODE = "SE"

const CARDS_CACHE_KEY = "CARDS"
const RACE_CACHE_KEY_SUFFIX = "-RACES"
const RUNNERS_CACHE_KEY_SUFFIX = "-RUNNERS"
const POOLS_CACHE_KEY_SUFFIX = "-POOLS"

const isAWantedPool = (pool: Pool) => pool.poolType.match(/^T\d/) || pool.poolType === "VOI";

const VEIKKAUS_CACHE = new NodeCache({
    useClones: false,
    stdTTL: 300
})

const fetchCardsForToday = async (): Promise<Card[]> => {
    
    if (VEIKKAUS_CACHE.has(CARDS_CACHE_KEY)) {
        return VEIKKAUS_CACHE.get(CARDS_CACHE_KEY)!
    }

    try {
        const response: AxiosResponse = await axios.get(`${VEIKKAUS_BASE_URL}/${CARD_PATH}`)
        const cards: Card[] = response.data.collection
        const swedishCards: Card[] =  cards.filter(card => card.country === SWEDEN_COUNTRY_CODE)
    
        VEIKKAUS_CACHE.set(CARDS_CACHE_KEY, swedishCards)
        return swedishCards

    } catch (error) {
        console.log("Coul not find cards for today, returning empty list", 'REASON:', error)
        return []
    }
}


const RACE_PATH_PREFIX = "card"
const RACE_PATH_SUFFIX = "races"

const fetchRacesForCard = async (card: Card): Promise<Race[]> => {

    const cacheKey = `${card.trackName}${RACE_CACHE_KEY_SUFFIX}`

    if (VEIKKAUS_CACHE.has(cacheKey)) {
        return VEIKKAUS_CACHE.get(cacheKey)!
    }

    try {
        const response = await axios.get(`${VEIKKAUS_BASE_URL}/${RACE_PATH_PREFIX}/${card.cardId}/${RACE_PATH_SUFFIX}`)
        const races: Race[] = response.data.collection

        VEIKKAUS_CACHE.set(cacheKey, races)
        return races

    } catch (error) {
        console.log("Coul not find races for", card.trackName, ", returning empty list")
        return []
    }
}


const RUNNERS_PATH_PREFIX = "race"
const RUNNERS_PATH_SUFFIX = "runners"

const fetchRunnersForRace = async (race: Race): Promise<Runner[]> => {

    const cacheKey = `${race.raceId}${RUNNERS_CACHE_KEY_SUFFIX}`

    if (VEIKKAUS_CACHE.has(cacheKey)) {
        return VEIKKAUS_CACHE.get(cacheKey)!
    }

    try {
        const response = await axios.get(`${VEIKKAUS_BASE_URL}/${RUNNERS_PATH_PREFIX}/${race.raceId}/${RUNNERS_PATH_SUFFIX}`)
        const runners: Runner[] = response.data.collection

        VEIKKAUS_CACHE.set(cacheKey, runners)
        return runners

    } catch (error) {
        console.log("Coul not find runners for race number", race.number, ", returning empty list")
        return []
    }
}


const POOLS_PATH_PREFIX = "race"
const POOLS_PATH_SUFFIX = "pools"

const fetchPoolsForRace = async (race: Race): Promise<Pool[]> => {
    const cacheKey = `${race.raceId}${POOLS_CACHE_KEY_SUFFIX}`

    if (VEIKKAUS_CACHE.has(cacheKey)) {
        return VEIKKAUS_CACHE.get(cacheKey)!
    }

    try {
        const response = await axios.get(`${VEIKKAUS_BASE_URL}/${POOLS_PATH_PREFIX}/${race.raceId}/${POOLS_PATH_SUFFIX}`)
        const pools: Pool[] = response.data.collection.filter(isAWantedPool)
        VEIKKAUS_CACHE.set(cacheKey, pools)
        return pools

    } catch (error) {
        console.log("Coul not find pools for race number", race.number, ", returning empty list")
        return []
    }
}

const ODD_PATH_PREFIX = "pool"
const ODD_PATH_SUFFIX = "odds"

const fetchOddsForPool = async (pool: Pool, race: Race): Promise<Odd[]> => {
    try {
        const response = await axios.get(`${VEIKKAUS_BASE_URL}/${ODD_PATH_PREFIX}/${pool.poolId}/${ODD_PATH_SUFFIX}`)
        const odds: Odd[] = response.data.odds

        return isVGame(pool) ? odds.filter(odd => odd.raceId === race.raceId) : odds

    } catch (error) {
        console.log("Coul not find odds for game ", pool.poolType, ", returning empty list")
        return []
    }
}

const isVGame = (pool: Pool): boolean => {
    switch (pool.poolType) {
        case 'T4':
            return true
        case 'T5':
            return true
        case 'T64':
            return true
        case 'T65':
            return true
        case 'T75':
            return true
        case 'T86':
            return true
        default:
            return false;
    }
}


export const VeikkausClient = {
    fetchCardsForToday,
    fetchRacesForCard,
    fetchRunnersForRace,
    fetchPoolsForRace,
    fetchOddsForPool
}