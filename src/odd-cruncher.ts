import { CommonOdd, Odd } from "./model/types";
import { Outcome } from "./model/unibet-types";


const createCommonOddFromUnibetOutcome = (outcome: Outcome): CommonOdd => {
    return {
        name: 'Unibet',
        percentage: (1 / (outcome.odds * 100)) * 100,
        decimal: outcome.odds * 100
    }
}

const createCommonOddFromVeikkausOdd = (type: string, odd: Odd): CommonOdd => {
    if (odd.percentage) {
        return {
            name: type,
            percentage: odd.percentage * 100,
            decimal: 1 / odd.percentage
        }
    } else {

        const percentage = odd.probable ? (1 / (odd.probable * 100)) * 100 : 0
        const probable = odd.probable ? odd.probable * 100 : 0

        return {
            name: type,
            percentage: percentage,
            decimal: probable
        }
    }
}

export const OddCruncher = {
    createCommonOddFromUnibetOutcome,
    createCommonOddFromVeikkausOdd
}