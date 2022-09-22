import {useState} from 'react';
import Fuse from 'fuse.js';
import './form.css';
import departureTimeSort from './departureTimeSort.js';
import {validateData, validateDateTime, getDifferentFields, stationNameToCamelcase, post, getRequestBodyForBothReturns} from './formSubmit';


const SearchForm = ({setResults, formData, setFormData, setPrevQuery, prevQuery}) => {
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
        if(!validateData(formData)){
			return;
		}

		let oneWay = !formData.returnDateTime;
		let roundtripNoOffers = formData.returnDateTime && formData.noAR 
        let differentFields = getDifferentFields(prevQuery.formData, formData)
        let outgoingResultsUpdate = false
		let results

		if (oneWay){
            let formattedData = {...formData, origin: stationNameToCamelcase(formData.origin), destination: stationNameToCamelcase(formData.destination)}
            results = await post('/outgoingOnly', formattedData) // File to run is the simple one that just return lines
			results.sort((a,b) => departureTimeSort(a,b,1));
            setResults({outgoing: results, returning: []})
            outgoingResultsUpdate = true //metadata stays false, needs to be reset if it was there

		} else if (roundtripNoOffers){
			if (differentFields.every(field => ['returnDateTime', 'noAR'].includes(field))){
                let body = {...formData, origin: stationNameToCamelcase(formData.origin), destination: stationNameToCamelcase(formData.destination)}
                results = await post('/outgoingOnly', body) // simple script no metadata since only return search
                setResults(old => ({...old, returning: results}))
			} else { // requests for both going out and back
                let body = {...formData, origin: stationNameToCamelcase(formData.origin), destination: stationNameToCamelcase(formData.destination)}
                results = await post('/allNoOffers', body) // this needs to return metadata
				results.results.outgoing.sort((a,b) => departureTimeSort(a,b,1));
				results.results.returning.sort((a,b) => departureTimeSort(a,b,1));
                setResults(results.results) // can't be just results since it needs to contain metadata
                outgoingResultsUpdate = true;
			}

		} else { // roundtrip with offers
            if (differentFields === ['noAR']){
                setResults(prev => ({...prev, returning : []}))
            } else if (differentFields === ['returnDateTime']){ // only searching new return trips based on previously selected ougoing train
                let body = getRequestBodyForBothReturns(formData, prevQuery)
                results = await post('/bothReturns', body)
                setResults(prev => ({...prev, returning: results}))
            } else { // search new outgoing results and reset return. 
                let body = {...formData, origin: stationNameToCamelcase(formData.origin), destination: stationNameToCamelcase(formData.destination)}
                results = await post('/outgoing', body)
                setResults({outgoing: results.results, returning: []}) // again can't be just res cause metadata coming back
                outgoingResultsUpdate = true
                // Whenever the outgoing research changes (origin, destination, passengers, datetime) the metadata needs reset. If metadata not set you cannot search for return results connected to outgoing
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
			value={formData.passengers}
		/>
		<label style={{display: formData.returnDateTime !== '' ? '' : 'none'}} >
			Ignore roundtrip offers
			<input type='checkbox' checked={formData.noAR} onChange={() => setFormData(oldData => ({...oldData, noAR: !oldData.noAR}))} />
		</label>
		<button>Search trains</button>
	  </form>
  );
}

export default SearchForm;
