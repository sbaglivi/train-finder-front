import SearchForm from './SearchForm.jsx';
import ResultsList from './ResultsList.jsx';
import ReturnResultsTable from './ReturnResultsTable.jsx';
import {useState} from 'react';

const App = () => {
	const [formData, setFormData] = useState({origin: '', destination: '', dateTime: '', returnDateTime: '', passengers: '100', noAR: false});
	const [trains, setTrains] = useState({outgoing: [], returning: []})
	const [error, setError] = useState('')
	const [prevQuery, setPrevQuery] = useState({
		formData: {}, time: 0, return: {
			italo: {trainId: '', inputValue: '', cookies: {}},
			trenitalia: {trainId: '', cartId: '', cookies: {}},
		}
	})
	const setOutgoingTrip = (id, company) => {
		setPrevQuery(old => ({...old, return: {...old.return, [company]: {...old.return[company], trainId: id}}}))
		console.log(prevQuery)
	}

	const reorderResults = (newResults, varName) => {
		setTrains(old => ({...old, [varName]: newResults}))
	}
	const roundtrip = formData.returnDateTime && !formData.noAR ? 'outgoing' : 'oneway'
	// let outgoingTrains = trains.outgoing.filter(train => train.id === prevQuery.return.italo.trainId || train.id === prevQuery.return.trenitalia.trainId)
	let outgoingTrains = {italo: prevQuery.return.italo.trainId ? trains.outgoing.filter(train => train.id === prevQuery.return.italo.trainId)[0] : [], trenitalia: prevQuery.return.trenitalia.trainId ? trains.outgoing.filter(train => train.id === prevQuery.return.trenitalia.trainId)[0] : []}

	return (
		<div>
			{error ? <p>{error}</p> : null}
			<SearchForm setTrains={setTrains} formData={formData} setFormData={setFormData} setPrevQuery={setPrevQuery} prevQuery={prevQuery} setError={setError}/>
			<div className='container' style={{display: 'flex'}}>
				{trains?.outgoing.length ? <ResultsList style={{width: trains?.returning.length ? '50vw' : '100vw'}} setOutgoingTrip={setOutgoingTrip} prevQuery={prevQuery} results={trains.outgoing} reorderResults={newOrder => reorderResults(newOrder, 'outgoing')} setTrains={setTrains} roundtrip={roundtrip} setError={setError}/> : null}
				{trains?.returning.length ? <ReturnResultsTable style={{width: '50vw'}} results={trains.returning} outgoingTrains={outgoingTrains} reorderResults={reorderResults} /> : null}
			</div>
		</div>
	)
}

export default App;
