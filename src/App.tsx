import SearchForm from './SearchForm';
import ResultsList from './ResultsList';
import ReturnResultsTable from './ReturnResultsTable';
import {useReducer} from 'react';
import {BallTriangle} from 'react-loader-spinner';

export type Action = {
	type: 'onewaySearch',
	payload: {query: State['prevQuery'], outgoing: Train[], error:string} 
} | {
	type: 'roundtripSearch',
	payload: {query: State['prevQuery'], outgoing: Train[], returning: Train[], metadata: State['metadata'], error:string} 
} | {
	type: 'returnTimeUpdate',
	payload: {query: State['prevQuery'], returning: Train[], error: string}
} | {
	type: 'selectOutgoingTrip',
	payload: {returning: Train[], chosen: State['trains']['chosen'], error:string}
} | { 
	type: 'setError',
	payload: {error: string}
} | {
	type:'reorderResults',
	payload: {direction: 'outgoing' | 'returning', newOrder: Train[]}
} | { 
	type: 'toggleLoading'
} | {
	type: 'toggleLoadingAndReset'
} | {
	type: 'requestFail',
	payload: {error: string, reqType: 'outgoing' | 'returning'}
}

function reducer(state:State, action: Action){
	switch(action.type){
		case 'onewaySearch':
			{
			// update prevQuery with formdata and current time - outgoing trains with results.
			// set error to error if present
			// reset metadata, chosen, returning
			const {query, outgoing, error} : {query: State['prevQuery'], outgoing:  Train[], error: string} = action.payload;
				const newState = {...initialState, trains: { ...initialState.trains, outgoing}, prevQuery: query, error, loading: false}
			return newState;
			}
		case 'roundtripSearch':
			{
			// update prevQuery, outgoing and returning trains, metadata
			// set error if present 
			// reset chosen
			const {query, outgoing, returning, metadata, error} = action.payload;
				const newState = {prevQuery: query, trains: {...initialState.trains, outgoing, returning}, metadata, error, loading: false}
			return newState;
			}
		case 'returnTimeUpdate':
			{
			// update prevQuery, returning trains
			// set error if present
			// resets chosen ? 
			// maintains metadata, outgoing
			const {query, returning, error} = action.payload;
				const newState = {...state, error, prevQuery: query, trains: {...state.trains, chosen: initialState.trains.chosen, returning}, loading: false} // resetting chosen
			return newState;
			}
		case 'selectOutgoingTrip':
			{
			// update returning trains, chosen
			// set error if present
			// resets nothing
			// maintains metadata, outgoing, prevQuery
			const {returning, chosen, error} = action.payload;
				const newState = {...state, trains: {...state.trains, returning, chosen}, error, loading: false};
			return newState;
			}
		case 'setError':
			{
			const {error} = action.payload;
				const newState = {...state, error, loading: false}
			return newState;
			}
		case 'reorderResults':
			{
			const {direction, newOrder} = action.payload;
				const newState = {...state, trains: {...state.trains, [direction]: newOrder}, loading: false};
			return newState;
			}
		case 'toggleLoading':
			return {...state, loading: !state.loading}
		case 'toggleLoadingAndReset':
			return {...initialState, loading: true};
		case 'requestFail':
			const {error, reqType} = action.payload;
			if (reqType === 'outgoing')
				return {...initialState, error}
			else
				return {...state, error, loading: false}
		default:
			return state;
	}
}


export type Train = {
	id: string,
	departureTime: string,
	arrivalTime: string,
	duration: string,
	minPrice: number | string,
	company:  'italo' | 'trenitalia',
	inputValue: string | undefined,
	minIndividualPrice: number | string | undefined,
	totPrice: number | undefined | string,
	young: string | undefined,
	senior: string | undefined,
	adult: string | undefined,
	returnMinPrice: number | string | undefined
}
export type State = {
	prevQuery: {
		formData: {origin: string, destination: string, dateTime: string, returnDateTime: string, passengers: string}, 
		time: number
	},
	trains: {
		outgoing: Train[],
		returning: Train[],
		chosen: { italo: Train | undefined, trenitalia: Train | undefined},
	},
	metadata: {italo: { cookies: Object}, trenitalia: {cartId: string, cookies: Object}},
	error: string,
	loading: boolean
}


const initialState:State = {
	prevQuery: {formData: {origin: '', destination: '', dateTime: '', returnDateTime: '', passengers: '100'}, time: 0},
	trains: {
		outgoing: [],
		returning: [],
		chosen: {italo: undefined, trenitalia: undefined} 
	},
	metadata: {italo: { cookies: {} }, trenitalia: { cartId: '', cookies: {}}},
	error: '',
	loading: false
}

// random comment
const App = () => {
	const [state, dispatch] = useReducer(reducer, initialState);
return (
		<>
			{!state.trains?.outgoing.length ? <h1>TrainFinder</h1> : null}
			<SearchForm state={state} dispatch={dispatch}/>
			{state.loading ? <BallTriangle height={100} width={100} color='black' radius={5} wrapperClass='loadingAnimation' />: null}
			{state.error ? <p style={{color: 'darkred'}}>{state.error}</p> : null}
			<div className='container' >
				{state.trains?.outgoing.length ? <ResultsList state={state} dispatch={dispatch} /> : null}
				{state.trains?.returning.length ? <ReturnResultsTable results={state.trains.returning} reorderResults={(newOrder: Train[]):void => dispatch({type: 'reorderResults', payload: {direction: 'returning', newOrder}})} outgoingTrains={state.trains.chosen}/> : null}
			</div>
		</>
	)
}

export default App;