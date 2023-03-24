import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { UnibetClient } from "./client/unibet-client";
import { VeikkausClient } from "./client/veikkaus-client";
import { Card, CommonOdd, Game, Horse, Odd, Pool, Race, Runner } from "./model/types";
import { Outcome } from "./model/unibet-types";
import { OddCruncher } from "./odd-cruncher";

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
	switch (event.path) {
		case '/cards':
			const cards = await handleCards()
			return cards
		case '/races':
			const races = await handleRaces(event)
			return races
		case '/races':
			const race = await handleRace(event)
			return race
		default:
			return {
				statusCode: 404,
				body: `Not found`
			}
	}
}

const handleCards = async (): Promise<APIGatewayProxyResult> => {
	const cards: Card[] = await VeikkausClient.fetchCardsForToday()

	return {
		statusCode: 200,
		body: JSON.stringify(cards)
	}
}

const handleRaces = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {

	if (!event.queryStringParameters || !event.queryStringParameters['card'] ) {
		return {
			statusCode: 400,
			body: 'card parameter required'
		}
	}

	const cardName = event.queryStringParameters['card']
	const cards: Card[] = await VeikkausClient.fetchCardsForToday()
	const card: Card | undefined = cards.find(card => card.trackName.toLowerCase() === cardName.toLowerCase())

	if (!card) {
		return {
			statusCode: 404,
			body: '[]'
		}
	}

	const races = await VeikkausClient.fetchRacesForCard(card)

	return {
		statusCode: 200,
		body: JSON.stringify(races)
	}
}


const handleRace = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
	if (!event.queryStringParameters ||
		!event.queryStringParameters['card'] ||
		!event.queryStringParameters['start'] ) {
		return {
			statusCode: 400,
			body: 'card and start parameters required'
		}
	}

	const cardName: string = event.queryStringParameters['card']
	const start: number = parseInt(event.queryStringParameters['start'])

	const cards: Card[] = await VeikkausClient.fetchCardsForToday()
	const card: Card | undefined = cards.find(card => card.trackName.toLowerCase() === cardName.toLowerCase())

	if (!card) {
		return {
			statusCode: 404,
			body: '[]'
		}
	}

	const races: Race[] = await VeikkausClient.fetchRacesForCard(card)
	const race: Race | undefined = races.find(race => race.number === start)

	if (!race) {
		return {
			statusCode: 404,
			body: '[]'
		}
	}

	const unibetOutcomes: Outcome[] = await UnibetClient.fetchUnibetOdds(cardName, start)
	const pools: Pool[] = await VeikkausClient.fetchPoolsForRace(race)
	const runners: Runner[] = await VeikkausClient.fetchRunnersForRace(race)


	const gamePromises: Promise<Game>[] = pools.map(async (pool: Pool) => {
		const veikkausOdds: Odd[] = await VeikkausClient.fetchOddsForPool(pool, race)
		return {
			type: pool.poolType,
			odds: veikkausOdds
		}
	})

	const games: Game[] = await Promise.all(gamePromises)

	const horses: Horse[] = runners.map(runner => {
		
		const actualName = runner.horseName.split('*')[0]

		const outcomesForRunner: CommonOdd[] = games.map((game): CommonOdd => {
			const correctOdd: Odd | undefined = game.odds.find(odd => odd.runnerNumber === runner.startNumber)

			if (!correctOdd) {
				return {
					name: 'Undefined',
					decimal: 0.0,
					percentage: 0.0
				}
			}

			return OddCruncher.createCommonOddFromVeikkausOdd(game.type, correctOdd)
		})

		const unibetOutcome: Outcome = 
			unibetOutcomes.find(outcome => outcome.label.toLowerCase() === actualName.toLowerCase()) ||
			{id: -1, label: actualName, startNro: runner.startNumber, odds: 0.0}
		
		const unibetOutcomeAsCommonOutcome = OddCruncher.createCommonOddFromUnibetOutcome(unibetOutcome)
		outcomesForRunner.push(unibetOutcomeAsCommonOutcome)

		return {
			number: runner.startNumber,
			name: actualName,
			frontShoes: runner.frontShoes === "HAS_SHOES",
			rearShoes: runner.frontShoes === "HAS_SHOES",
			driver: runner.driverName,
			coach: runner.coachName,
			odds: outcomesForRunner
		}

	})

	return {
		statusCode: 200,
		body: JSON.stringify(horses)
	}
}