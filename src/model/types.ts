export type Card = {
    cardId: number;
    country: string;
    trackName: string;
    trackAbbreviation: string;
}

export type Race = {
    raceId: number;
    cardId: number;
    number: number;
    distance: number;
    breed: 'L' | 'K';
    startType: 'VOLT_START' | 'CAR_START';
    seriesSpecification: string;
}

export type Runner = {
    runnerId: number;
    horseName: number;
    startNumber: number;
    startTrack: number;
    distance: number;
    frontShoes: 'HAS_SHOES' | 'NO_SHOES'
    rearShoes: 'HAS_SHOES' | 'NO_SHOES'
    stats: object;
    coachName: string;
    driverName: string;
    scratched: boolean;
}

export type Pool = {
    poolId: number;
    poolType: 'VOI' | 'SIJ' | 'KAK' | 'TRO' | 'EKS' | 'T4' | 'T5' | 'T64' | 'T65' | 'T75' | 'T86' 
}

export type Odd = {
    runnerNumber: number;
    probable?: number;
    percentage?: number;
    raceId?: number; // is only in V-games
}