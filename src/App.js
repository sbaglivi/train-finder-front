import SearchForm from './SearchForm.jsx';
import ResultsList from './ResultsList.jsx';
import {useState} from 'react';

const App = () => {
	const [formData, setFormData] = useState({origin: '', destination: '', dateTime: '', returnDateTime: '', passengers: '100', noAR: false});
	const [trains, setTrains] = useState({outgoing: [], returning: []})
	const [prevQuery, setPrevQuery] = useState({
		formData: {}, time: 0, return: {
			italo: {trainId: '', inputValue: '', cookies: {}},
			trenitalia: {trainId: '', cartId: '', cookies: {}},
		}
	})

	const reorderResults = (newResults, varName) => {
		setTrains(old => ({...old, [varName]: newResults}))
	}
	const roundtrip = formData.returnDateTime && !formData.noAR;

	return (
		<div>
			<SearchForm setTrains={setTrains} formData={formData} setFormData={setFormData} setPrevQuery={setPrevQuery} prevQuery={prevQuery}/>
			<div className='container' style={{display: 'flex'}}>
				{trains?.outgoing.length ? <ResultsList style={{width: trains?.returning.length ? '50vw' : '100vw'}} prevQuery={prevQuery} results={trains.outgoing} reorderResults={newOrder => reorderResults(newOrder, 'outgoing')} setTrains={setTrains} roundtrip={roundtrip}/> : null}
				{trains?.returning.length ? <ResultsList style={{width: '50vw'}} results={trains.returning} reorderResults={(newOrder) => reorderResults(newOrder, 'returning')} /> : null}
			</div>
		</div>
	)
}

export default App;
