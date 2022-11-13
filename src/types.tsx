export type Action = {
    type: 'onewaySearch',
    payload: { query: State['prevQuery'], outgoing: Train[], error: string }
} | {
    type: 'roundtripSearch',
    payload: { query: State['prevQuery'], outgoing: Train[], returning: Train[], metadata: State['metadata'], error: string }
} | {
    type: 'returnTimeUpdate',
    payload: { query: State['prevQuery'], returning: Train[], error: string }
} | {
    type: 'selectOutgoingTrip',
    payload: { returning: Train[], chosen: State['trains']['chosen'], error: string }
} | {
    type: 'setError',
    payload: { error: string }
} | {
    type: 'reorderResults',
    payload: { direction: 'outgoing' | 'returning', sortOrder: { by: keyof Train, asc: number } }
} | {
    type: 'toggleLoading'
} | {
    type: 'toggleLoadingAndReset'
} | {
    type: 'requestFail',
    payload: { error: string, reqType: 'outgoing' | 'returning' }
} | {
    type: 'setSaved',
    payload: { newSaved: State['trains']['saved'] }
} | {
    type: 'loadSearch',
    payload: { search: PreviousSearch }
} | {
    type: 'deleteSearch',
    payload: { search: PreviousSearch }
}

export type Train = {
    id: string,
    departureTime: string,
    arrivalTime: string,
    duration: string,
    company: 'italo' | 'trenitalia',
    inputValue: string | undefined,
    young: string | undefined,
    senior: string | undefined,
    adult: string | undefined,
    minPrice: number, // one way, but need to change the name on back end to be able toc change this one
    minOnewayPrice: number | undefined,
    minRoundtripPrice: number | undefined,
    minIndividualPrice: number,
    totPrice: number,
    totPriceHint: string,
    roundTripIsBestPrice: boolean
}

export type TrainWD = Train & {
    returning: boolean,
    date: string,
    passengers: string
}

export type FormData = {
    origin: string, destination: string, dateTime: string, returnDateTime: string, passengers: string
}

export type PreviousSearch = {
    formData: FormData,
    results: {
        outgoing: Train[],
        returning: Train[]
    }
}

export type State = {
    prevQuery: {
        formData: FormData,
        time: number
    },
    trains: {
        outgoing: Train[],
        returning: Train[],
        chosen: { italo: Train | undefined, trenitalia: Train | undefined },
        saved: {
            [index: string]: TrainWD[]
        }
    },
    metadata: { italo: { cookies: Object }, trenitalia: { cartId: string, cookies: Object } },
    error: string,
    loading: boolean,
    previousSearches: PreviousSearch[]
}
