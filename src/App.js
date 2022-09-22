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
	// newresults needs to be {query: {params}, trenitalia: {err: '', res: [], cartId:''}, italo: {err: '', res: []}}
	const [results, setResults] = useState({error: '', results: [], trenitaliaCartId: '', query: {time: ''}, trenitaliaCookies: {}, italoCookies: {}}); // if time passed too big either need to remake first request or smthing
	const [returnResults, setReturnResults] = useState({trenitaliaQuery: '', italoQuery: '', results: []})
	// Vorrei una lista unica con tutti i risultati per poterli riordinare ecc, al contempo pero' questo mi creera' qualche fastidio in piu'
	// quando dovro' rimpiazzare i risultati di una delle 2 compagnie.
	const reorderResults = newResults => {
		setResults(oldResults => ({...oldResults, results: newResults}));
	}
	const roundtrip = formData.returnDateTime && !formData.noAR;
	const onClick = async () => {
		let response = await fetch('/dev', {
			method: 'POST',
			headers: {
				'Accept': 'application/json'
			}
		});
		if(!response.ok){
			console.log('response from /dev was not ok');
			return;
		}
		let data = await response.json();
		let parsedData = JSON.parse(data);
		console.log(parsedData);
		console.log(typeof parsedData);
		setResults(parsedData);
	}

	return (
		<div>
			<SearchForm setResults={setResults} results={results} formData={formData} setFormData={setFormData}/>
			<button onClick={() => setReturnResults(oldRes => ({...oldRes, results: results.results}))}>returnres from res</button>
			<button onClick={() => setReturnResults(oldRes => ({...oldRes, results: []}))}>eliminate ret res</button>
			{results.error ? <p>{results?.error}</p> : null}
			<div class='container' style={{display: 'flex'}}>
				{results?.results.length ? <ResultsList style={{width: returnResults?.results.length ? '50vw' : '100vw'}} results={results} reorderResults={reorderResults} setReturnResults={setReturnResults} roundtrip={roundtrip}/> : null}
				{returnResults?.results.length ? <ResultsList style={{width: '50vw'}} results={returnResults} reorderResults={reorderResults} /> : null}
			</div>
		</div>
	)
}

export default App;
