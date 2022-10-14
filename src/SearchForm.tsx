import {useState} from 'react';
import Fuse from 'fuse.js';
import departureTimeSort from './departureTimeSort.js';
import {validateData, validateDateTime, getDifferentFields, stationNameToCamelcase, post as postWithoutDispatch} from './formSubmit';
import {State, Action, Train} from './App'


const SearchForm = ({state, dispatch}:{state:State, dispatch: (action: Action) => void}) => {
	const [formData, setFormData] = useState({origin: '', destination: '', dateTime: '', returnDateTime: '', passengers: '100'});
	const [searchResults, setSearchResults] = useState<string[]>([]);
	const [ulOffset, setUlOffset] = useState({left: 0, top: 0});

	const acceptedStations = ['Milano Centrale', 'Milano Garibaldi', 'Reggio Emilia', 'Bologna', 'Firenze', 'Roma Termini', 'Roma Tiburtina', 'Napoli Centrale', 'Napoli Afragola', 'Salerno', 'Vallo della Lucania'];
	const fuse = new Fuse(acceptedStations, {includeScore: true});
	let ulDisplay = searchResults.length > 0 ? 'block' : 'none';

	const post = async (path:string, body:BodyInit, returning:boolean = false) => {
		return await postWithoutDispatch(path,body,returning, dispatch);
	}
	const updateFormData = (e: React.ChangeEvent<HTMLInputElement>) => {
		const name = e.target.name
		setFormData(formData => ({...formData, [name]: e.target.value}))
	}

	const updateValueAndSearchResults = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData(formData => ({...formData, [e.target.name]: e.target.value}));
		setSearchResults(fuse.search(e.target.value).map(result => result.item))
	}

	const acceptSearchResult = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' || e.key === 'Tab'){
			if (searchResults.length > 0){
				if (e.key === 'Enter') e.preventDefault();
				let target = e.target as HTMLInputElement;
				setFormData(formData => ({...formData, [target.name]: searchResults[0]}))
				setSearchResults([]);
			}
		}
	}
	const acceptSearchResultOnClick = (value:string) => {
		let activeElement = document.activeElement 
		if (activeElement instanceof HTMLInputElement){
			let field = activeElement.name;
			setFormData(old => ({...old, [field]: value}));
			setSearchResults([]);
			if (activeElement.name === 'origin'){
				let destinationInput = document.getElementById('destinationInput')
				if(destinationInput) destinationInput.focus()
			} else {
				let dateTimeInput = document.getElementById('dateTimeInput')
				if (dateTimeInput) dateTimeInput.focus()
			}
		}
	}

	const showSearchResults = (e: React.ChangeEvent<HTMLInputElement>) => {

		const name:string = (e.target as HTMLInputElement).name
		if (!Object.keys(formData).includes(name)) return
		setSearchResults(fuse.search(formData[(name as keyof typeof formData)]).map(result => result.item))
		// const leftOffset = e.target.getBoundingClientRect().left;
		// const topOffset = e.target.getBoundingClientRect().bottom;
		const leftOffset = e.target.offsetLeft
		const topOffset = e.target.offsetTop + e.target.offsetHeight;
		setUlOffset({left: leftOffset, top: topOffset});

	}
	const getResults = async (e:React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
        if(!validateData(formData, setFormData, acceptedStations)){
			return;
		}

		let oneWay = !formData.returnDateTime;
		let differentFields:string[] | [] = getDifferentFields(state.prevQuery.formData, formData)
		if (differentFields.length === 0)
			return;
		let currentTimestamp = Date.now() 
		let query = {formData, time: currentTimestamp}
		let origin = stationNameToCamelcase(formData.origin)
		let destination = stationNameToCamelcase(formData.destination)
		let results

		if (oneWay){
			console.log('making search')
			let reqBody = {...formData, origin, destination}
            results = await post('/outgoingOnly', JSON.stringify(reqBody)) // File to run is the simple one that just return lines
			if(!results) return;
			results.results.sort((a:Train, b:Train) => departureTimeSort(a,b,1));
			dispatch({type: 'onewaySearch', payload: {query, outgoing: results.results, error: results.error}})

			// fields that can change: origin / dest / datetime / returndate / pass
			// origin / dest / datetime / pass new search for out and back without offers, when outgoign gets selected search offers
			// return -> if outgoing already selected new double search: return dependent and independent.
			//        -> if not selected only independent return search
		} else {
			if (differentFields.length === 1 &&  differentFields[0] === 'returnDateTime'){
				// should check if already chosen selected
				let body = {...formData, origin: destination, destination: origin} // swapped them because I'm looking for return trips, no?
				results = await post('/outgoingOnly', JSON.stringify(body), true) // simple script no metadata since only return search
				if(!results) return;
				results.results.sort((a:Train,b:Train) => departureTimeSort(a,b,1));
				dispatch({type: 'returnTimeUpdate', payload: {query, error: results.error, returning: results.results}});
			} else {
				let body = {...formData, origin, destination}
				results = await post('/allNoOffers', JSON.stringify(body)) // this needs to return metadata
				if(!results) return;
				results.results.outgoing.sort((a:Train,b:Train) => departureTimeSort(a,b,1));
				results.results.returning.sort((a:Train,b:Train) => departureTimeSort(a,b,1));
				dispatch({type: 'roundtripSearch', payload: {query, error: results.error, outgoing: results.results.outgoing, returning: results.results.returning, metadata: results.metadata}})
			}
		}
	}

  return (
	  <form onSubmit={getResults}>
		  <ul  style={{display: ulDisplay, left: `${ulOffset.left}px`, top: `${ulOffset.top}px`}}> 
			  {searchResults.map((result,index) => 
			  <li key={index} onClick={acceptSearchResultOnClick.bind(null,result)} onMouseDown={(e) => e.preventDefault()}>{result}</li>
			  )}
		  </ul>
		  <div className='column col-1'  >
		  <label htmlFor='originInput'>Partenza:</label>
			  <input id='originInput' autoComplete='off' type='text' placeholder='Milano' name='origin' value={formData.origin} onChange={updateValueAndSearchResults} onKeyDown={acceptSearchResult} onBlur={() =>  setSearchResults([])} onFocus={showSearchResults} />
		  </div>
		  <div className='column col-2'>
			  <label htmlFor='destinationInput'>Destinazione:</label>
			  <input id='destinationInput' autoComplete='off' type='text' placeholder='Roma' name='destination' value={formData.destination} onChange={updateValueAndSearchResults} onBlur={() => setSearchResults([])} onKeyDown={acceptSearchResult} onFocus={showSearchResults}/>
			</div>
		  <div className='column col-3'>
			  <label htmlFor='dateTimeInput'>Data/ora partenza:</label>
			  <input id='dateTimeInput' type='text' autoComplete='off' placeholder='dd/mm hh' name='dateTime' value={formData.dateTime} onBlur={e => validateDateTime(e.target.value, setFormData)} onChange={updateFormData} />
		  </div>
		  <div className='column col-4'>
			  <label htmlFor='returnDateTimeInput'>Ritorno: (opzionale)</label>
			  <input id='returnDateTimeInput' type='text' autoComplete='off' placeholder='dd/mm hh' name='returnDateTime' value={formData.returnDateTime} onBlur={e => validateDateTime(e.target.value, setFormData, formData.dateTime)} onChange={updateFormData} />
		  </div>
		  <div className='passengersDiv col-5'>
			  <input id='passengersInput' autoComplete='off' type='text' pattern="[1-9][0-9]{2}|[0-9][1-9][0-9]|[0-9]{2}[1-9]" minLength={3} maxLength={3} placeholder='ASY' name='passengers' 
				  title="3 numbers from 0 to 9 that describe respectively the number of adult, senior and young passengers. (At least one needs to be different from 0)" onChange={updateFormData} 
				  value={formData.passengers} className='passengersInput'
			  />
			  <label htmlFor='passengersInput' className='passengersLabel'>
				  Adulti
				  Senior
				  Giovani
			  </label>
		  </div>
		  <button className='formSearchButton'>Search</button>
	  </form>
  );
}

export default SearchForm;
