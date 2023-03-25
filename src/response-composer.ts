import { Odd, Runner, Game, Card, Race } from "./model/veikkaus-types"
import { Outcome } from "./model/unibet-types"
import { OddCruncher } from "./odd-cruncher"
import { Horse, CommonOdd, Track, Starts } from "./model/types"


const composeCardsResponse = (cards: Card[]): Track[] => {
    return cards.map((card: Card): Track => {
        return {
            name: card.trackName
        }
    })
}

const composeStartsResponse = (races: Race[]): Starts => {
    return {
        count: races.length
    }
}

const composeRaceResponse = (runners: Runner[], games: Game[], unibetOutcomes: Outcome[]): Horse[] => {
    const horses: Horse[] = runners.map(runner => {
		const actualName = runner.horseName.split('*')[0]

		const outcomesForRunner: CommonOdd[] = games.map((game): CommonOdd | null => {
			const correctOdd: Odd | undefined = game.odds.find(odd => odd.runnerNumber === runner.startNumber)

			if (!correctOdd) return null

			return OddCruncher.createCommonOddFromVeikkausOdd(game.type, correctOdd)
		}).filter(odd => odd) as CommonOdd[] // Filter out null odds

		const unibetOutcome: Outcome =
			unibetOutcomes.find(outcome => outcome.label.toLowerCase() === actualName.toLowerCase()) ||
			{ id: -1, label: actualName, startNro: runner.startNumber, odds: 0.0 }

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


    return horses
}

export const ResponseComposer = {
    composeCardsResponse,
    composeStartsResponse,
    composeRaceResponse
}