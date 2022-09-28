import SearchForm from './SearchForm.jsx';
import ResultsList from './ResultsList.jsx';
import ReturnResultsTable from './ReturnResultsTable.jsx';
import {useState, useReducer} from 'react';

function reducer(state, action){
	switch(action.type){
		case 'setOutgoingTrips':
			return;
		case 'setReturnTrips':
			return;
		case 'completeReturnTrips':
			return;
		case 'setPreviousQuery':
			return;
		case 'setChosenTrips':
			return;
	}
}

const initialState = {
	prevQuery: {},
	trains: {
		outgoing: [],
		returning: [],
		chosen: {italo: {}, trenitalia: {}} 
	},
	error: ''
}

// random comment
const App = () => {
	const [formData, setFormData] = useState({origin: '', destination: '', dateTime: '', returnDateTime: '', passengers: '100'});
	const [trains, setTrains] = useState({outgoing: [], returning: [], chosen: {italo: {}, trenitalia: {}}})
	const [error, setError] = useState('')
	const [prevQuery, setPrevQuery] = useState({
		formData: {}, time: 0, return: {
			italo: {cookies: {}},
			trenitalia: {cartId: '', cookies: {}},
		}
	})
	const [state, dispatch] = useReducer(reducer, initialState);

	const reorderResults = (newResults, varName) => {
		setTrains(old => ({...old, [varName]: newResults}))
	}

	return (
		<div>
			{error ? <p>{error}</p> : null}
			<SearchForm setTrains={setTrains} formData={formData} setFormData={setFormData} setPrevQuery={setPrevQuery} prevQuery={prevQuery} setError={setError} outgoingTrains={trains.chosen}/>
			<div className='container' >
				{trains?.outgoing.length ? <ResultsList style={{width: trains?.returning.length ? '50vw' : '100vw'}}  prevQuery={prevQuery} results={trains.outgoing} reorderResults={reorderResults} setTrains={setTrains} setError={setError} returnTrains={trains.returning}/> : null}
				{trains?.returning.length ? <ReturnResultsTable style={{width: '50vw'}} results={trains.returning} reorderResults={reorderResults} outgoingTrains={trains.chosen}/> : null}
			</div>
		</div>
	)
}

export default App;
