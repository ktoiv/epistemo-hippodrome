import axios, { AxiosResponse } from "axios"
import { Card, Odd, Pool, Race, Runner } from "../model/types"

const VEIKKAUS_BASE_URL = process.env.VEIKKAUS_URL

const CARD_PATH = "cards/today"
const SWEDEN_COUNTRY_CODE = "SE"

const fetchCardsForToday = async (): Promise<Card[]> => {
    try {
        const response: AxiosResponse = await axios.get(`${VEIKKAUS_BASE_URL}/${CARD_PATH}`)
        const cards: Card[] = response.data.collection
        return cards.filter(card => card.country === SWEDEN_COUNTRY_CODE)

    } catch (error) {
        console.log("Coul not find cards for today, returning empty list", 'REASON:', error)
        return []
    }
}


const RACE_PATH_PREFIX = "card"
const RACE_PATH_SUFFIX = "races"

const fetchRacesForCard = async (card: Card): Promise<Race[]> => {
    try {
        const response = await axios.get(`${VEIKKAUS_BASE_URL}/${RACE_PATH_PREFIX}/${card.cardId}/${RACE_PATH_SUFFIX}`)
        const races: Race[] = response.data.collection

        return races

    } catch (error) {
        console.log("Coul not find races for", card.trackName, ", returning empty list")
        return []
    }
}


const RUNNERS_PATH_PREFIX = "race"
const RUNNERS_PATH_SUFFIX = "runners"

const fetchRunnersForRace = async (race: Race): Promise<Runner[]> => {
    try {
        const response = await axios.get(`${VEIKKAUS_BASE_URL}/${RUNNERS_PATH_PREFIX}/${race.raceId}/${RUNNERS_PATH_SUFFIX}`)
        const runners: Runner[] = response.data.collection
        return runners

    } catch (error) {
        console.log("Coul not find runners for race number", race.number, ", returning empty list")
        return []
    }
}


const POOLS_PATH_PREFIX = "race"
const POOLS_PATH_SUFFIX = "pools"

const fetchPoolsForRace = async (race: Race): Promise<Pool[]> => {
    try {
        const response = await axios.get(`${VEIKKAUS_BASE_URL}/${POOLS_PATH_PREFIX}/${race.raceId}/${POOLS_PATH_SUFFIX}`)
        const pools: Pool[] = response.data.collection

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