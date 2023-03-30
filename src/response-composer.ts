import { Odd, Runner, Game, Card, Race } from "./model/veikkaus-types"
import { Outcome } from "./model/unibet-types"
import { OddCruncher } from "./odd-cruncher"
import { Horse, CommonOdd, Track, Starts } from "./model/types"
import { StallFormEngine } from "./stallform-engine"


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

const composeRaceResponse = async (runners: Runner[], games: Game[], unibetOutcomes: Outcome[]): Promise<Horse[]> => {

	const winnerGame = games.find(game => game.type === "VOI")
	if (!winnerGame) return []

    const horsePromises: Promise<Horse>[] = runners.map(async runner => {
		const actualName = runner.horseName.split('*')[0]

		const outcomesForRunner: CommonOdd[] = games.map((game): CommonOdd | null => {
			const correctOdd: Odd | undefined = game.odds.find(odd => odd.runnerNumber === runner.startNumber)

			if (!correctOdd) return null

			return OddCruncher.createCommonOddFromVeikkausOdd(game.type, correctOdd)
		}).filter(odd => odd) as CommonOdd[] // Filter out null odds

		const unibetOutcome: Outcome =
			unibetOutcomes.find(outcome => outcome.label.toLowerCase() === actualName.toLowerCase()) ||
			{ id: -1, label: actualName, startNro: runner.startNumber, odds: 0.0 }

		const winnerOutcome: CommonOdd = outcomesForRunner.find(outcome => outcome.name === "VOI") || {name: 'VOI', decimal: 0.0, percentage: 0}
		const unibetOutcomeAsCommonOutcome: CommonOdd = OddCruncher.createCommonOddFromUnibetOutcome(unibetOutcome)
		outcomesForRunner.push(unibetOutcomeAsCommonOutcome)

		const stallform = await StallFormEngine.calculateStallformForCoach(runner.coachName)
		const kellyBettingAmount = calculateBetWithKellyFormula(winnerOutcome.percentage, unibetOutcomeAsCommonOutcome.percentage, stallform)
		

		return {
			number: runner.startNumber,
			name: actualName,
			frontShoes: runner.frontShoes === "HAS_SHOES",
			rearShoes: runner.frontShoes === "HAS_SHOES",
			driver: runner.driverName,
			coach: runner.coachName,
			stallform: stallform,
			amount: kellyBettingAmount,
			odds: outcomesForRunner
		}
	})


    return await Promise.all(horsePromises)
}

const calculateBetWithKellyFormula = (winnerOdds: number, unibetOdds: number, stallform: number): number => {
	const percentage = (((unibetOdds / 100) * (1 + (stallform / 100) )) * (1 / (winnerOdds / 100)) - 1) / ((1 / (winnerOdds / 100)) - 1)
	return 100 * percentage
}

export const ResponseComposer = {
    composeCardsResponse,
    composeStartsResponse,
    composeRaceResponse
}