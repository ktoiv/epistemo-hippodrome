import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { UnibetClient } from "./client/unibet-client";
import { VeikkausClient } from "./client/veikkaus-client";
import { Card, Game, Odd, Pool, Race, Runner } from "./model/veikkaus-types";
import { Outcome } from "./model/unibet-types";
import { ResponseComposer } from "./response-composer";
import { Horse, Starts, Track } from "./model/types";

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
	try {
		switch (event.path) {
			case '/cards':
				const cards = await handleCards()
				return cards
			case '/races':
				const races = await handleRaces(event)
				return races
			case '/race':
				const race = await handleRace(event)
				return race
			default:
				return {
					statusCode: 404,
					body: `Not found`
				}
		}
	} catch (e: any) {
		return {
			statusCode: 500,
			body: e.message
		}
	}

}

const handleCards = async (): Promise<APIGatewayProxyResult> => {
	const cards: Card[] = await VeikkausClient.fetchCardsForToday()
	const tracks: Track[] = ResponseComposer.composeCardsResponse(cards)
	return {
		statusCode: 200,
		body: JSON.stringify(tracks)
	}
}

const handleRaces = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
	const cardName = validateTrackRequestParams(event)
	const cards: Card[] = await VeikkausClient.fetchCardsForToday()
	const card: Card | undefined = cards.find(card => card.trackName.toLowerCase() === cardName.toLowerCase())

	if (!card) throw new Error(`Card ${cardName} not found`)

	const races: Race[] = await VeikkausClient.fetchRacesForCard(card)
	const starts: Starts = ResponseComposer.composeStartsResponse(races)

	return {
		statusCode: 200,
		body: JSON.stringify(starts)
	}
}


const handleRace = async (event: any): Promise<APIGatewayProxyResult> => {
	// Validate the incoming request parameters
	const { cardName, start } = validateRaceRequestParams(event)

	const cards: Card[] = await VeikkausClient.fetchCardsForToday()
	const card: Card | undefined = cards.find(card => card.trackName.toLowerCase() === cardName.toLowerCase())

	if (!card) throw new Error(`Card ${cardName} not found`)

	const races: Race[] = await VeikkausClient.fetchRacesForCard(card)
	const race: Race | undefined = races.find(race => race.number === start)

	if (!race) throw new Error(`Race ${start} not found`)

	const unibetOutcomes: Outcome[] = await UnibetClient.fetchUnibetOdds(cardName, start)
	const pools: Pool[] = await VeikkausClient.fetchPoolsForRace(race)
	
	const gamePromises: Promise<Game>[] = pools.map(async (pool: Pool) => {
		const veikkausOdds: Odd[] = await VeikkausClient.fetchOddsForPool(pool, race)
		return {
			type: pool.poolType,
			odds: veikkausOdds
		}
	})
	
	const games: Game[] = await Promise.all(gamePromises)

	const runners: Runner[] = await VeikkausClient.fetchRunnersForRace(race)
	const horses: Horse[] = await ResponseComposer.composeRaceResponse(runners, games, unibetOutcomes)

	return {
		statusCode: 200,
		body: JSON.stringify(horses)
	}
}

const validateTrackRequestParams = (event: APIGatewayEvent) => {
	const queryParams = event.queryStringParameters

	if (!queryParams || !queryParams['card']) {
		throw new Error('card and start parameters are required')
	}

	return queryParams['card']
}

const validateRaceRequestParams = (event: APIGatewayEvent) => {
	const queryParams = event.queryStringParameters

	if (!queryParams || !queryParams['card'] || !queryParams['start']) {
		throw new Error('card and start parameters are required')
	}

	const cardName = queryParams['card']
	const start = parseInt(queryParams['start'])

	return { cardName, start }
}