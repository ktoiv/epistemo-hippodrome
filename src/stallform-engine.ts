import { ScanCommand } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommandInput } from "@aws-sdk/lib-dynamodb"
import NodeCache from "node-cache"
import { ddbClient } from "./client/ddb-client"


const client = DynamoDBDocumentClient.from(ddbClient)

const STALLFORM_CACHE = new NodeCache({
    useClones: false,
    stdTTL: 3000
})

const createScanCommand = (
    filterExpression: string,
    expressionAttributeNames: Record<string, string>,
    expressionAttributeValues: Record<string, unknown>
): ScanCommand => {
    const scanInput: ScanCommandInput = {
        TableName: 'stallform',
        FilterExpression: filterExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
    };
    return new ScanCommand(scanInput);
};

const calculateStallformForCoach = async (coachName: string): Promise<number> => {

    if (STALLFORM_CACHE.has(coachName)) {
        return STALLFORM_CACHE.get(coachName) as number
    }

    const monthInMillis = 1000 * 60 * 60 * 24 * 30
    const currentTime = new Date().getTime()

    const monthAgo = currentTime - monthInMillis

    const lastMonthWinCommand = createScanCommand(
        '#coach = :coach and #winner = :winner and #date > :timestamp',
        {
            '#coach': 'coach',
            '#winner': 'winner',
            '#date': 'date'
        },
        {
            ':coach': coachName,
            ':winner': true,
            ':timestamp': monthAgo
        }
    );
    const lastMonthStartCommand = createScanCommand(
        '#coach = :coach and #date > :timestamp',
        {
            '#coach': 'coach',
            '#date': 'date'
        },
        {
            ':coach': coachName,
            ':timestamp': monthAgo
        }
    );
    const overallWinCommand = createScanCommand(
        '#coach = :coach and #winner = :winner',
        {
            '#coach': 'coach',
            '#winner': 'winner'
        },
        {
            ':coach': coachName,
            ':winner': true
        }
    );
    const overallStartCommand = createScanCommand(
        '#coach = :coach',
        {
            '#coach': 'coach'
        },
        {
            ':coach': coachName
        }
    );
    

    try {
        const [lastMonthWinResult, lastMonthStartResult, overallWinResult, overallStartResult] = await Promise.all([
            client.send(lastMonthWinCommand),
            client.send(lastMonthStartCommand),
            client.send(overallWinCommand),
            client.send(overallStartCommand)
        ]);

        const winPercentageLastMonth = (lastMonthWinResult.Count || 0) / (lastMonthStartResult.Count || 1);
        const winPercentageOverall = (overallWinResult.Count || 0) / (overallStartResult.Count || 1);

        const stallform = (winPercentageLastMonth - winPercentageOverall) * 100;

        STALLFORM_CACHE.set(coachName, stallform)

        return stallform
    } catch (e) {
        console.error(e);
        STALLFORM_CACHE.set(coachName, 0)
        return 0;
    }
}

export const StallFormEngine = {
    calculateStallformForCoach
}