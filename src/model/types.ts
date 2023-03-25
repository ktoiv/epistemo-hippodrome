
export type Track = {
    name: string
}

export type Starts = {
    count: number
}

export type CommonOdd = {
    name: string,
    decimal: number,
    percentage: number
}

export type Horse = {
    number: number
    name: string
    frontShoes: boolean
    rearShoes: boolean
    driver: string
    coach: string
    odds: CommonOdd[]
}