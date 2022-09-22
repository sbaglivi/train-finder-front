import {useState} from 'react';
import parse from 'date-fns/parse';
import Fuse from 'fuse.js';
import './form.css';
import format from 'date-fns/format'; //usage format(date, dateTimeFormat)
import departureTimeSort from './departureTimeSort.js';


const SearchForm = ({setResults, formData, setFormData, results}) => {
	const [searchResults, setSearchResults] = useState([]);
	const [ulOffsetLeft, setUlOffsetLeft] = useState(0);
	const stationNameToCamelcase = str => {
		let newStr = str.replaceAll(' ','');
		newStr = newStr.charAt(0).toLowerCase() + newStr.slice(1);
		return newStr
	}
	const onSubmit = async e => {
		e.preventDefault();
		validateDateTime(formData.dateTime, 'dateTime')
		if(formData.returnDateTime)  validateDateTime(formData.returnDateTime, 'returnDateTime')
		let necessaryFields = ['origin', 'destination','dateTime', 'passengers']
		if (necessaryFields.some(k => !formData[k])){
			console.log(formData);
			console.log('At least one of the form fields is falsy, check the object above for more info');
			return;
		}
		if (!acceptedStations.includes(formData.origin)){
			let possibleResults = fuse.search(formData.origin).map(result => result.item)
			if (possibleResults.length === 0){
				console.log('No station found that matches '+formData.origin);
				setFormData(oldData => ({...oldData, origin: ''}))
				return;
			}
			setFormData(oldData => ({...oldData, origin: possibleResults[0]}))
		}
		if (!acceptedStations.includes(formData.destination)){
			let possibleResults = fuse.search(formData.destination).map(result => result.item)
			if (possibleResults.length === 0){
				console.log('No station found that matches '+formData.destination);
				setFormData(oldData => ({...oldData, destination: ''}))
				return;
			}
			setFormData(oldData => ({...oldData, destination: possibleResults[0]}))
		}
		if (formData.origin === formData.destination){
			console.log('Origin and destination cannot be the same.');
			return;
		}
		//let formattedDateTime = `${String(dateTime.getDate()).padStart(2,'0')}-${String(dateTime.getMonth()+1).padStart(2,'0')}-${String(dateTime.getFullYear()).slice(-2)} ${dateTime.getHours().toString().padStart(2,'0')}`;
		let formattedData = {...formData, origin: stationNameToCamelcase(formData.origin), destination: stationNameToCamelcase(formData.destination)}
		let oneWay = !formData.returnDateTime;
		let roundtripNoOffers = formData.returnDateTime && formData.noAR 
		// const [formData, setFormData] = useState({origin: '', destination: '', dateTime: '', returnDateTime: '', passengers: '100', noAR: false});
		const getDifferentFields = (prevQuery, curQuery) => {
			let importantFields = ['origin', 'destination', 'dateTime', 'returnDateTime', 'passengers', 'noAR']
			return importantFields.filter(field => prevQuery[field] !== curQuery[field])
		}		
		if (formData.noAR && differentFields === ['noAR']){
			// cases in which I change nothing
			// prev query === this query outside of just formData.noAR
			setResults(old => ({...old, query: {...old.query, noAR: formData.noAR}}))
			return;
		} else if (formData.noAR && differentFields === ['dateTime']){
			// cases in which I change only going out results
			// formData.noAR is true and prevq === q outside of going out time
			setResults(old => ({...old, query: {...old.query, ...formattedData}, results: []})) //not updating time of query until I actually get the new results
		} else if ((formData.noAR && (differentFields === ['returnDateTime'] || differentFields === ['noAR'])) || (!formData.noAR && differentFields === ['returnDateTime'])) {
			// cases in which I only switch coming back results
			// no offers change coming back time - no offers switching to offers - offers and only changing return time
			setResults(old => ({...old, query: {...old.query, ...formData}}))
			// I should reset return results but I don't have the setter here
		} else if (!formData.noAR || differentFields !== ['noAR']){
			// cases in which I change everything

		}
		if (oneWay){
			let response = await fetch('/run', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(formattedData)
			})
			if (!response.ok){
				console.log('Response was not ok while submitting');
				return
			}
			let content = await response.json();
			content = JSON.parse(content);
			console.log(content)
			content.results.sort((a,b) => departureTimeSort(a,b,1));
			let currentTimestamp = Date.now()
			setResults(old => ({...old, query: {...formData, time: currentTimestamp}, results: content.results}))
			// WIPE RETURN RESULTS --------------------------------------_____!!!!!!!!!!!!!!!!!!11
		} else if (roundtripNoOffers){
			console.log('You tried to submit a roundtrip request with no offers!')
			let differentFields = getDifferentFields(results.query, formData)
			if (differentFields === ['noAR']){
				return
			} else if (differentFields === ['dateTime']){
				// only request to update outgoing trip
				let response = await fetch('/run', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json'
					},
					body: JSON.stringify(formattedData)
				})
				if (!response.ok){
					console.log('Response was not ok while submitting');
					return
				}
				let content = await response.json();
				content.results.sort((a,b) => departureTimeSort(a,b,1));
				let currentTimestamp = Date.now()
				setResults(old => ({...old, query: {...formData, time: currentTimestamp}, results: content.results}))
			} else if (differentFields === ['returnDateTime']){
				// only request to update coming back trip
				let invertedTripData = {...formattedData, origin: formattedData.destination, destination: formattedData.origin, dateTime: formattedData.returnDateTime, returnDateTime: formattedData.dateTime}
				let response = await fetch('/run', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json'
					},
					body: JSON.stringify(invertedTripData)
				})
				if (!response.ok){
					console.log('Response was not ok while submitting');
					return
				}
				let content = await response.json();
				content.results.sort((a,b) => departureTimeSort(a,b,1));
				// UPDATE RETURN RESULTS ---------------------------------- !!!!!!!!!!1111111111
			} else {
				// both requests
				let response = await fetch('/doublerequest', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json'
					},
					body: JSON.stringify(formattedData)
				})
				if (!response.ok){
					console.log('Response was not ok while submitting');
					return
				}
				let content = await response.json();
				content.outgoingResults.sort((a,b) => departureTimeSort(a,b,1));
				content.returnResults.sort((a,b) => departureTimeSort(a,b,1));
				let currentTimestamp = Date.now()
				setResults(old => ({...old, query: {...formData, time: currentTimestamp}, results: content.outgoingResults}))
				// UPDATE RETURN RESULTS ----------------------------- !!!!!!!!!!!!!!!1111111111111
			}
			/*
			- change in trains no longer having offers changes nothing 
			- change in going out time changes going out results
			- change in coming back time change only ret results
			- change in going out depstation changes everything
			- change in going out arrstation changes everything
			- change in passengers changes everything
			*/
		} else {
			/*
			- change in coming back time should change only ret results
			- change in trains having offers changes return results
			- change in going out depstation changes everything
			- change in going out time changes everything
			- change in going out arrstation changes everything
			- change in passengers changes everything
			*/
			let differentFields = getDifferentFields(results.query, formData)
			if (differentFields === ['returnDateTime'] || differentFields === ['noAR']){
				// going out results are the same, just wipe out return results and update query
			} else {
				// everything changes, wipe out return results and make a new query
			}
			console.log(formattedData)
			console.log('You tried to submit a full roundtrip request!')
			let response = await fetch('/aera', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(formattedData)
			})
			if (!response.ok){
				console.log('Response was not ok while submitting');
				return
			}
			let content = await response.json();
			content = JSON.parse(content)
			console.log(content)
			content.results.sort((a,b) => departureTimeSort(a,b,1));
			setResults(oldResults => ({...oldResults, trenitaliaCartId: content.cartId, results: content.results, query: {...formattedData, time: currentTimestamp}, trenitaliaCookies: content.trenitaliaCookies, italoCookies: content.italoCookies}))
		}
	}
	const onChange = e => {
		const name = e.target.name
		setFormData(formData => ({...formData, [name]: e.target.value}))
	}
	const referenceDate = new Date();
	referenceDate.setHours(referenceDate.getHours()+1, 0, 0, 0);
	function validateDateTime(str, fieldName){
		const possibleDateTimeFormats = ["dd/MM/yy HH", "dd/MM/yy"]
		let errorText = ''
		for (let possibleFormat of possibleDateTimeFormats){
			try {
				let parsedDate = parse(str, possibleFormat, referenceDate)
				if (isNaN(parsedDate)) throw Error("Invalid date");
				if (possibleFormat === 'dd/MM/yy'){
					if (fieldName === 'dateTime'){
						if (format(parsedDate, 'dd/MM/yy') === format(referenceDate, 'dd/MM/yy')) parsedDate.setHours(referenceDate.getHours())
						else parsedDate.setHours('08');
					} else {
						let depDateTimeObject = parse(formData.dateTime, 'dd/MM/yy HH', referenceDate)
						if (format(parsedDate, 'dd/MM/yy') === format(depDateTimeObject, 'dd/MM/yy')) parsedDate.setHours(depDateTimeObject.getHours()+1)
						else parsedDate.setHours('08');
					}
				}
				if (parsedDate < referenceDate) throw Error("Parsed date is before current date and time")
				if (fieldName === 'returnDateTime' && parsedDate <= parse(formData.dateTime, 'dd/MM/yy HH', referenceDate)) throw Error("Parsed return trip date is before departure date and time")
				setFormData(formData => ({...formData, [fieldName]: format(parsedDate, 'dd/MM/yy HH')}));
				return
			} catch (err) {
				errorText += `Error: ${err.message} while parsing date: ${str} with format ${possibleFormat}\n`;
			}
		}
		console.log(errorText)
		setFormData(formData => ({...formData, [fieldName]: ''}));
	}

	const onBlur = event => {
		validateDateTime(event.target.value, event.target.name)
	} 
	const acceptedStations = ['Milano Centrale', 'Milano Garibaldi', 'Reggio Emilia', 'Bologna', 'Firenze', 'Roma Termini', 'Roma Tiburtina', 'Napoli Centrale', 'Napoli Afragola', 'Salerno', 'Vallo della Lucania'];
	const fuse = new Fuse(acceptedStations, {includeScore: true});
	const stationOnChange = e => {
		setFormData(formData => ({...formData, [e.target.name]: e.target.value}));
		setSearchResults(fuse.search(e.target.value).map(result => result.item)) //.filter(item => e.target.name === 'origin' ? item !== formData.destination : item !== formData.origin));
	}
	const onKeyDown = e => {
		if (e.key === 'Enter' || e.key === 'Tab'){
			if (searchResults.length > 0){
				if (e.key === 'Enter') e.preventDefault();
				setFormData(formData => ({...formData, [e.target.name]: searchResults[0]}))
				setSearchResults([]);
			}
		}
	}
	let ulShown = searchResults.length > 0 ? 'block' : 'none';
	const onFocus = e => {
		const {target: {name}} = e;
		setSearchResults(fuse.search(formData[name]).map(result => result.item)) //.filter(item => item !== (name === 'origin' ? formData.destination : formData.origin)))
		const leftOffset = e.target.getBoundingClientRect().left;
		console.log(leftOffset);
		setUlOffsetLeft(leftOffset);

	}
  return (
	  <form action='/run' method='POST' onSubmit={onSubmit}>
	  <ul style={{display: ulShown, left: `${ulOffsetLeft}px`}}>
		{searchResults.map((result,index) => <li key={index}>{result}</li>)}
	  </ul>
	  	<input type='text' placeholder='Origin' name='origin' value={formData.origin} onChange={stationOnChange} onKeyDown={onKeyDown} onBlur={() => setSearchResults([])} onFocus={onFocus} />
	  	<input type='text' placeholder='Destination' name='destination' value={formData.destination} onChange={stationOnChange} onBlur={() => setSearchResults([])} onKeyDown={onKeyDown} onFocus={onFocus}/>
	  <input type='text' placeholder='dd/mm/yy hh' name='dateTime' value={formData.dateTime} onBlur={onBlur} onChange={onChange} />
	  <input type='text' placeholder='dd/mm/yy hh' name='returnDateTime' value={formData.returnDateTime} onBlur={onBlur} onChange={onChange} />
	  <input type='text' pattern="[1-9][0-9]{2}|[0-9][1-9][0-9]|[0-9]{2}[1-9]" minLength="3" maxLength="3" placeholder='ASY' name='passengers' 
	  title="3 numbers from 0 to 9 that describe respectively the number of adult, senior and young passengers. (At least one needs to be different from 0)" onChange={onChange} 
	  value={formData.passengers}/>
	  <label style={{display: formData.returnDateTime !== '' ? '' : 'none'}} >
		Ignore roundtrip offers
		<input type='checkbox' checked={formData.noAR} onChange={() => setFormData(oldData => ({...oldData, noAR: !oldData.noAR}))} />
	  </label>

	  <button>Search trains</button>
	  </form>
  );
}

export default SearchForm;
