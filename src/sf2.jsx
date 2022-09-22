import {useState} from 'react';
import parse from 'date-fns/parse';
import Fuse from 'fuse.js';
import './form.css';
import format from 'date-fns/format'; //usage format(date, dateTimeFormat)


const SearchForm = ({setResults, formData, setFormData, results}) => {
	const [searchResults, setSearchResults] = useState([]);
	const [ulOffsetLeft, setUlOffsetLeft] = useState(0);

	const referenceDate = new Date();
	referenceDate.setHours(referenceDate.getHours()+1, 0, 0, 0);
	const acceptedStations = ['Milano Centrale', 'Milano Garibaldi', 'Reggio Emilia', 'Bologna', 'Firenze', 'Roma Termini', 'Roma Tiburtina', 'Napoli Centrale', 'Napoli Afragola', 'Salerno', 'Vallo della Lucania'];
	const fuse = new Fuse(acceptedStations, {includeScore: true});
	let ulDisplay = searchResults.length > 0 ? 'block' : 'none';

	const updateFormData = e => {
		const name = e.target.name
		setFormData(formData => ({...formData, [name]: e.target.value}))
	}

	function validateDateTime(str, fieldName){
		const acceptedDateTimeFormats = ["dd/MM/yy HH", "dd/MM/yy"]
		let errorText = ''
		for (let possibleFormat of acceptedDateTimeFormats){
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
				return true
			} catch (err) {
				errorText += `Error: ${err.message} while parsing date: ${str} with format ${possibleFormat}\n`;
			}
		}
		console.log(errorText)
		setFormData(formData => ({...formData, [fieldName]: ''}));
		return false
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
  return (
	  <form action='/run' method='POST' onSubmit={onSubmit}>
		<ul style={{display: ulDisplay, left: `${ulOffsetLeft}px`}}>
			{searchResults.map((result,index) => <li key={index}>{result}</li>)}
		</ul>
		<input type='text' placeholder='Origin' name='origin' value={formData.origin} onChange={updateValueAndSearchResults} onKeyDown={acceptSearchResult} onBlur={() => setSearchResults([])} onFocus={showSearchResults} />
		<input type='text' placeholder='Destination' name='destination' value={formData.destination} onChange={updateValueAndSearchResults} onBlur={() => setSearchResults([])} onKeyDown={acceptSearchResult} onFocus={showSearchResults}/>
		<input type='text' placeholder='dd/mm/yy hh' name='dateTime' value={formData.dateTime} onBlur={e => validateDateTime(e.target.value, e.target.name)} onChange={updateFormData} />
		<input type='text' placeholder='dd/mm/yy hh' name='returnDateTime' value={formData.returnDateTime} onBlur={e => validateDateTime(e.target.value, e.target.name)} onChange={updateFormData} />
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
