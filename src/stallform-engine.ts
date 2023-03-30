import NodeCache from "node-cache"
import HorsePerformance from "./model/database-model"

const STALLFORM_CACHE = new NodeCache({
    useClones: false,
    stdTTL: 3000
})


const calculateStallformForCoach = async (coachName: string): Promise<number> => {

    if (STALLFORM_CACHE.has(coachName)) {
        return STALLFORM_CACHE.get(coachName) as number
    }

    const monthInMillis = 1000 * 60 * 60 * 24 * 30
    const currentTime = new Date().getTime()

    const monthAgo = currentTime - monthInMillis

    try {

        const lastMonthWinCount = await HorsePerformance.countDocuments({
            coach: coachName,
            winner: true,
            date: { $gt: monthAgo }
        });
        const lastMonthStartCount = await HorsePerformance.countDocuments({
            coach: coachName,
            date: { $gt: monthAgo }
        });;
        const overallWinCount = await HorsePerformance.countDocuments({
            coach: coachName,
            winner: true,
        });;
        const overallStartCount = await HorsePerformance.countDocuments({
            coach: coachName,
        });;

        const winPercentageLastMonth = (lastMonthWinCount || 0) / (lastMonthStartCount || 1);
        const winPercentageOverall = (overallWinCount || 0) / (overallStartCount || 1);

        const stallform = (winPercentageLastMonth - winPercentageOverall) * 100;

        STALLFORM_CACHE.set(coachName, stallform)

        return stallform
    } catch (e) {
        console.error(e)
        STALLFORM_CACHE.set(coachName, 0)
        return 0;
    }
}

export const StallFormEngine = {
    calculateStallformForCoach
}