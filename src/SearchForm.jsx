import {useState} from 'react';
import Fuse from 'fuse.js';
import './form.css';
import departureTimeSort from './departureTimeSort.js';
import {validateData, validateDateTime, getDifferentFields, stationNameToCamelcase, post} from './formSubmit';


const SearchForm = ({setTrains, formData, setFormData, setPrevQuery, prevQuery, setError, outgoingTrains}) => {
	const [searchResults, setSearchResults] = useState([]);
	const [ulOffsetLeft, setUlOffsetLeft] = useState(0);

	const acceptedStations = ['Milano Centrale', 'Milano Garibaldi', 'Reggio Emilia', 'Bologna', 'Firenze', 'Roma Termini', 'Roma Tiburtina', 'Napoli Centrale', 'Napoli Afragola', 'Salerno', 'Vallo della Lucania'];
	const fuse = new Fuse(acceptedStations, {includeScore: true});
	let ulDisplay = searchResults.length > 0 ? 'block' : 'none';

	const updateFormData = e => {
		const name = e.target.name
		setFormData(formData => ({...formData, [name]: e.target.value}))
	}

	const updateValueAndSearchResults = e => {
		setFormData(formData => ({...formData, [e.target.name]: e.target.value}));
		setSearchResults(fuse.search(e.target.value).map(result => result.item))
	}

	const acceptSearchResult = e => {
		if (e.key === 'Enter' || e.key === 'Tab'){
			if (searchResults.length > 0){
				if (e.key === 'Enter') e.preventDefault();
				setFormData(formData => ({...formData, [e.target.name]: searchResults[0]}))
				setSearchResults([]);
			}
		}
	}

	const showSearchResults = e => {
		const {target: {name}} = e;
		setSearchResults(fuse.search(formData[name]).map(result => result.item))
		const leftOffset = e.target.getBoundingClientRect().left;
		setUlOffsetLeft(leftOffset);

	}
	const getResults = async e => {
		e.preventDefault();
        if(!validateData(formData, setFormData, acceptedStations)){
			return;
		}

		let oneWay = !formData.returnDateTime;
        let differentFields = getDifferentFields(prevQuery.formData, formData)
        let outgoingResultsUpdate = false
		let results

		if (oneWay){
            let formattedData = {...formData, origin: stationNameToCamelcase(formData.origin), destination: stationNameToCamelcase(formData.destination)}
            results = await post('/outgoingOnly', JSON.stringify(formattedData)) // File to run is the simple one that just return lines
			if (results.error) setError(results.error);
			else setError('')
			results.results.sort((a,b) => departureTimeSort(a,b,1));
            setTrains({outgoing: results.results, returning: []})
            outgoingResultsUpdate = true //metadata stays false, needs to be reset if it was there

			// fields that can change: origin / dest / datetime / returndate / pass
			// origin / dest / datetime / pass new search for out and back without offers, when outgoign gets selected search offers
			// return -> if outgoing already selected new double search: return dependent and independent.
			//        -> if not selected only independent return search
		} else {
			if (differentFields === ['returnDateTime']){
				if (prevQuery.return.italo.trainId || prevQuery.return.trenitalia.trainId){
					if (outgoingTrains.italo){
						// if train arr is later than new dep, search conditioned return and normal return
						// if not then remove outgoing from being selected and just search normal
						console.log('maybe I should search for results conditioned on same outgoing trip? outgoing trips');
					}
					if (outgoingTrains.trenitalia){
						console.log('maybe I should search for results conditioned on same outgoing trip? and not reset outgoing trips');
					}
					let body = {origin: stationNameToCamelcase(formData.destination), destination: stationNameToCamelcase(formData.origin), dateTime: formData.returnDateTime, passengers: formData.passengers}
					results = await post('/outgoingOnly', JSON.stringify(body)) // this needs to return metadata
					if (results.error) setError(results.error);
					else setError('')
					setTrains(old => ({...old, returning: results.results.sort((a,b) => departureTimeSort(a,b,1)), chosen: {italo: {}, trenitalia: {}}}))
				} else {
					let body = {...formData, origin: stationNameToCamelcase(formData.destination), destination: stationNameToCamelcase(formData.origin)} // swapped them because I'm looking for return trips, no?
					results = await post('/outgoingOnly', JSON.stringify(body)) // simple script no metadata since only return search
					if (results.error) setError(results.error);
					else setError('')
					results.results.sort((a,b) => departureTimeSort(a,b,1));
					setTrains(old => ({...old, returning: results.results}))
				}
			} else {
				let body = {...formData, origin: stationNameToCamelcase(formData.origin), destination: stationNameToCamelcase(formData.destination)}
				results = await post('/allNoOffers', JSON.stringify(body)) // this needs to return metadata
				if (results.error) setError(results.error);
				else setError('')
				results.results.outgoing.sort((a,b) => departureTimeSort(a,b,1));
				results.results.returning.sort((a,b) => departureTimeSort(a,b,1));
				setTrains(old => ({...old, ...results.results})) // can't be just results since it needs to contain metadata
				outgoingResultsUpdate = true;
			}
		}

		if (outgoingResultsUpdate){
			let currentTimestamp = Date.now() 
			if (formData.returnDateTime){
				let {metadata} = results;
				setPrevQuery(old => ({...old, formData: formData, time: currentTimestamp, return: {italo: {...old.return.italo, cookies: metadata.italoCookies}, trenitalia: {...old.return.trenitalia, cookies: metadata.trenitaliaCookies, cartId: metadata.cartId}}}))
			} else {
				setPrevQuery({formData, time: currentTimestamp, return: {italo: {trainId: '', inputValue: '', cookies: {}}, trenitalia: {trainId: '', cartId: '', cookies: {}}}})
			}
		} else {
			setPrevQuery(old => ({...old, formData: formData}))
		}
	}

  return (
	  <form onSubmit={getResults}>
		<ul style={{display: ulDisplay, left: `${ulOffsetLeft}px`}}>
			{searchResults.map((result,index) => <li key={index}>{result}</li>)}
		</ul>
		<input type='text' placeholder='Origin' name='origin' value={formData.origin} onChange={updateValueAndSearchResults} onKeyDown={acceptSearchResult} onBlur={() => setSearchResults([])} onFocus={showSearchResults} />
		<input type='text' placeholder='Destination' name='destination' value={formData.destination} onChange={updateValueAndSearchResults} onBlur={() => setSearchResults([])} onKeyDown={acceptSearchResult} onFocus={showSearchResults}/>
		<input type='text' placeholder='dd/mm/yy hh' name='dateTime' value={formData.dateTime} onBlur={e => validateDateTime(e.target.value, setFormData)} onChange={updateFormData} />
		<input type='text' placeholder='dd/mm/yy hh' name='returnDateTime' value={formData.returnDateTime} onBlur={e => validateDateTime(e.target.value, setFormData, formData.dateTime)} onChange={updateFormData} />
		<input type='text' pattern="[1-9][0-9]{2}|[0-9][1-9][0-9]|[0-9]{2}[1-9]" minLength="3" maxLength="3" placeholder='ASY' name='passengers' 
			title="3 numbers from 0 to 9 that describe respectively the number of adult, senior and young passengers. (At least one needs to be different from 0)" onChange={updateFormData} 
			value={formData.passengers} className='passengersInput'
		/>
		<button>Search trains</button>
	  </form>
  );
}

export default SearchForm;
