import SearchForm from './components/SearchForm';
import SavedList from './components/SavedList';
import Table from './components/Table';
import { useReducer } from 'react';
import { BallTriangle } from 'react-loader-spinner';
import PreviousSearches from './components/PreviousSearches';
import { applySortOrder, post, stationNameToCamelcase, addRoundtripPrices, getDifferentFields, getDispatchBody, getRoundtripDiscounts } from './utilityFunctions';
import { MdOutlineTrain } from 'react-icons/md'
import { Action, PreviousSearch, State, Train } from './types';

function reducer(state: State, action: Action) {
	switch (action.type) {
		case 'onewaySearch':
			{
				// update prevQuery with formdata and current time - outgoing trains with results.
				// set error to error if present
				// reset metadata, chosen, returning
				const { query, outgoing, error }: { query: State['prevQuery'], outgoing: Train[], error: string } = action.payload;
				let { previousSearches } = state;
				previousSearches = previousSearches.slice(-4);
				previousSearches.push({ formData: query.formData, results: { outgoing, returning: [] } });
				const newState = { ...initialState, trains: { ...initialState.trains, saved: state.trains.saved, outgoing }, prevQuery: query, error, loading: false, previousSearches }
				localStorage.setItem('previousSearches', JSON.stringify(previousSearches));
				return newState;
			}
		case 'roundtripSearch':
			{
				// update prevQuery, outgoing and returning trains, metadata
				// set error if present 
				// reset chosen
				const { query, outgoing, returning, metadata, error } = action.payload;
				let { previousSearches } = state;
				previousSearches = previousSearches.slice(-4);
				previousSearches.push({ formData: query.formData, results: { outgoing, returning } });
				const newState = { prevQuery: query, trains: { ...initialState.trains, saved: state.trains.saved, outgoing, returning }, metadata, error, loading: false, previousSearches }
				localStorage.setItem('previousSearches', JSON.stringify(previousSearches));
				return newState;
			}
		case 'returnTimeUpdate':
			{
				// update prevQuery, returning trains
				// set error if present
				// resets chosen ? 
				// maintains metadata, outgoing
				const { query, returning, error } = action.payload;
				const newState = { ...state, error, prevQuery: query, trains: { ...state.trains, chosen: initialState.trains.chosen, returning }, loading: false } // resetting chosen
				return newState;
			}

		case 'selectOutgoingTrip':
			{
				// update returning trains, chosen
				// set error if present
				// resets nothing
				// maintains metadata, outgoing, prevQuery
				const { returning, chosen, error } = action.payload;
				const newState = { ...state, trains: { ...state.trains, returning, chosen }, error, loading: false };
				return newState;
			}

		case 'setError':
			{
				const { error } = action.payload;
				const newState = { ...state, error, loading: false }
				return newState;
			}

		case 'reorderResults':
			{
				const { direction, sortOrder } = action.payload;
				const newOrder = applySortOrder(sortOrder, state.trains[direction])
				const newState = { ...state, trains: { ...state.trains, [direction]: newOrder }, loading: false };
				return newState;
			}

		case 'setSaved':
			{
				const { newSaved } = action.payload;
				const newState = { ...state, trains: { ...state.trains, saved: newSaved } };
				localStorage.setItem('savedTrains', JSON.stringify(newSaved));
				return newState;
			}
		case 'loadSearch':
			{
				const { search } = action.payload;
				const newState = { ...state, prevQuery: { formData: search.formData, time: 0 }, trains: { ...state.trains, outgoing: search.results.outgoing, returning: search.results.returning, chosen: initialState.trains.chosen }, metadata: initialState.metadata }
				return newState;
			}
		case 'deleteSearch':
			{
				const { search } = action.payload;
				let previousSearches = state.previousSearches;
				previousSearches = previousSearches.filter(prevSearch => (Object.keys(search.formData) as Array<keyof typeof search.formData>).some(key => search.formData[key] !== prevSearch.formData[key]))
				localStorage.setItem('previousSearches', JSON.stringify(previousSearches));
				const newState = { ...state, previousSearches }
				return newState;
			}

		case 'toggleLoading':
			return { ...state, loading: !state.loading }

		case 'toggleLoadingAndReset':
			return { ...initialState, previousSearches: state.previousSearches, trains: { ...initialState.trains, saved: state.trains.saved }, loading: true };

		case 'requestFail':
			const { error, reqType } = action.payload;
			if (reqType === 'outgoing')
				return { ...initialState, previousSearches: state.previousSearches, error }
			else
				return { ...state, error, loading: false }

		default:
			return state;
	}
}



const initialState: State = {
	prevQuery: { formData: { origin: '', destination: '', dateTime: '', returnDateTime: '', passengers: '100' }, time: 0 },
	trains: {
		outgoing: [],
		returning: [],
		chosen: { italo: undefined, trenitalia: undefined },
		saved: {}
	},
	metadata: { italo: { cookies: {} }, trenitalia: { cartId: '', cookies: {} } },
	error: '',
	loading: false,
	previousSearches: []
}

function stateInit(initialState: State) {
	let savedTrains = localStorage.getItem('savedTrains');
	if (savedTrains !== null) {
		try {
			initialState.trains.saved = JSON.parse(savedTrains);
		} catch {
			console.log(`Error while loading savedTrains from localStorage`);
			localStorage.removeItem('savedTrains');
		}
	}
	let previousSearches = localStorage.getItem('previousSearches');
	if (previousSearches !== null) {
		try {
			initialState.previousSearches = JSON.parse(previousSearches);
		} catch {
			console.log(`Error while loading previousSearches from localStorage`);
			localStorage.removeItem('previousSearches');
		}
	}
	return initialState;
}

const App = () => {
	const [state, dispatch] = useReducer(reducer, initialState, stateInit);

	function getSavedHash(station1: string, station2: string) {
		return `${station1}-${station2}`;
	}

	function deleteSavedItinerary(hash: string) {
		let newSaved = state.trains.saved;
		if (!(hash in newSaved)) {
			console.log(`Tried to delete itinerary ${hash} but it's not present in saved`);
			return;
		}
		delete newSaved[hash];
		dispatch({ type: 'setSaved', payload: { newSaved } });
		return;
	}

	function deleteSavedTrain(element: Train, origin: string, destination: string) {
		let possibleHashes = [getSavedHash(origin, destination), getSavedHash(destination, origin)];
		let newSaved = state.trains.saved;
		for (let hash of possibleHashes) {
			if (hash in newSaved) {
				if (state.trains.saved[hash].length === 1) {
					delete newSaved[hash];
				} else {
					newSaved[hash] = newSaved[hash].filter(train => train.id !== element.id);
				}
				dispatch({ type: 'setSaved', payload: { newSaved } });
				return;
			}
		}
		console.log("Could not delete saved train, its hash didn't match any present saved train group");
		return;
	}
	function saveTrain(train: Train, returning: boolean) { // SE RETURNING E" VERO MA L'HASH E' L'OPPOSTO, DEVO NEGARE RETURNING? ??? ?? ??
		let { origin, destination, passengers } = state.prevQuery.formData;
		let date = returning ? state.prevQuery.formData.returnDateTime : state.prevQuery.formData.dateTime;
		date = date.slice(0, 5);
		let possibleHashes = [getSavedHash(origin, destination), getSavedHash(destination, origin)];
		let newSaved = state.trains.saved;
		for (let i = 0; i < possibleHashes.length; i++) {
			const hash = possibleHashes[i];
			if (hash in newSaved) {
				if (newSaved[hash].filter(savedTrain => savedTrain.id === train.id).length >= 1) {
					console.log("Tried to save a train that's already saved")
					return;
				}
				if (i === 0) newSaved[hash].push({ ...train, returning: returning, date, passengers });
				else newSaved[hash].push({ ...train, returning: !returning, date, passengers }); // since the hash is reversed the previous search was in the opposite direction
				console.log(`Using hash #${i}`);
				dispatch({ type: 'setSaved', payload: { newSaved } });
				return;
			}
		}
		newSaved[possibleHashes[0]] = [{ ...train, returning: returning, date, passengers }];
		dispatch({ type: 'setSaved', payload: { newSaved } });
		return;
	}

	function loadSearch(search: PreviousSearch) {
		dispatch({ type: 'loadSearch', payload: { search } });
		return;
	}

	function deleteSearch(search: PreviousSearch) {
		dispatch({ type: 'deleteSearch', payload: { search } });
		return;
	}

	const searchReturn = async (train: Train) => {
		if (state.trains.chosen[train.company] === train) {
			console.log('The train you clicked on is already the one selected')
			return;
		}
		if ((Date.now() - state.prevQuery.time) / 1000 > 300) {
			console.log('More than 5 minutes passed since original request, might be too much!')
			return;
		}

		dispatch({ type: 'toggleLoading' });
		try {
			let reqResults = await getRoundtripDiscounts(state.prevQuery.formData, state.metadata, train);
			if (!reqResults?.results?.length) throw Error(`Results.length <= 0: ${reqResults.error}`);
			console.log('Return results.length > 0, updating prices');
			let chosen = { ...state.trains.chosen, [train.company]: train }
			let newReturningTrains = addRoundtripPrices(reqResults, state.trains.returning, chosen, train.company)
			dispatch({ type: 'selectOutgoingTrip', payload: { returning: newReturningTrains, chosen, error: reqResults.error } });
		} catch (e) {
			let errorMessage;
			if (e instanceof Error)
				errorMessage = e.message
			else if (typeof e === 'string')
				errorMessage = e
			else errorMessage = 'Received an error that was neither Error type nor string';
			console.log('request for ' + train.company + ' returns failed' + errorMessage);
			dispatch({ type: 'setError', payload: { error: errorMessage } });
		}
	}

	async function onFormSearch(formData: State["prevQuery"]["formData"]) {
		let differentFields: string[] | [] = getDifferentFields(state.prevQuery.formData, formData)
		if (differentFields.length === 0)
			return;
		let returnOnly = (differentFields.length === 1 && differentFields[0] === 'returnDateTime');

		returnOnly ? dispatch({ type: 'toggleLoading' }) : dispatch({ type: 'toggleLoadingAndReset' });
		let dispatchBody = await getDispatchBody(formData, returnOnly);
		if (dispatchBody) dispatch(dispatchBody);
	}

	return (
		<>
			{!state.trains?.outgoing.length ?
				<div style={{ display: "flex", alignItems: "center", columnGap: "1em" }}>
					<h1>TrainFinder</h1><MdOutlineTrain size={50} />
				</div>
				: null}
			{Object.keys(state.trains.saved).length ? <SavedList savedTrains={state.trains?.saved} deleteSavedTrain={deleteSavedTrain} deleteSavedItinerary={deleteSavedItinerary} /> : null}
			<SearchForm onFormSearch={onFormSearch} />
			<PreviousSearches previousSearches={state.previousSearches} loadSearch={loadSearch} deleteSearch={deleteSearch} />
			{state.loading ? <BallTriangle height={100} width={100} color='black' radius={5} wrapperClass='loadingAnimation' /> : null}
			{state.error ? <p style={{ color: 'darkred' }}>{state.error}</p> : null}
			<div className='container' >
				{state.trains.outgoing.length ? <Table trains={state.trains.outgoing} dispatch={dispatch} isReturning={false} outgoingSelected={state.trains.chosen} searchReturn={searchReturn} returnResults={state.trains.returning.length > 0} isRoundtrip={state.prevQuery.formData.returnDateTime !== ""} /> : null}
				{state.trains.returning.length ? <Table trains={state.trains.returning} dispatch={dispatch} isReturning={true} /> : null}
			</div>
		</>
	)
}

export default App;