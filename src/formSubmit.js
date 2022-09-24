import parse from 'date-fns/parse';
import format from 'date-fns/format';

export const validateData = (data, setFormData, acceptedStations) => {
	if (!validateDateTime(data.dateTime, setFormData))
		return false
	if (!validateDateTime(data.returnDateTime, setFormData, data.dateTime))
		return false
	if (!acceptedStations.includes(data.origin)){
		console.log(data.origin+' is not a valid station name')
		return false
	}
	if (!acceptedStations.includes(data.destination)){
		console.log(data.destination+' is not a valid station name')
		return false
	}
	return true
}

// This needs string to parse, fieldname to understand if it's a return date or going out, the going out date if it's parsing a return date, wants setformdata to set the format to the correct one
// I could just pass string and an optional goingout date string to differentiate the fieldname, if I want this function to correct the data I need access to the setter.
// If this was only used directly by the form I could return the data to be set but it sometimes gets called by a middleman like validatedata
export function validateDateTime(str, setFormData, goingOutDateTime=''){
	const referenceDate = new Date();
	referenceDate.setHours(referenceDate.getHours()+1, 0, 0, 0);
	const acceptedDateTimeFormats = ["dd/MM/yy HH", "dd/MM/yy", 'dd/MM HH', 'dd/MM']
	let errorText = ''
    let fieldName = goingOutDateTime === '' ? 'dateTime' : 'returnDateTime';

	for (let possibleFormat of acceptedDateTimeFormats){
		try {
			let parsedDate = parse(str, possibleFormat, referenceDate)
			if (isNaN(parsedDate)) throw Error("Invalid date");
			if (possibleFormat === 'dd/MM/yy' || possibleFormat === 'dd/MM'){
				if (fieldName === 'dateTime'){
					if (format(parsedDate, possibleFormat) === format(referenceDate, possibleFormat)) parsedDate.setHours(referenceDate.getHours())
					else parsedDate.setHours('08');
				} else {
					let depDateTimeObject = parse(goingOutDateTime, 'dd/MM/yy HH', referenceDate)
					if (format(parsedDate, possibleFormat) === format(depDateTimeObject, possibleFormat)) parsedDate.setHours(depDateTimeObject.getHours()+1)
					else parsedDate.setHours('08');
				}
			}
			if (parsedDate < referenceDate) throw Error("Parsed date is before current date and time")
			if (fieldName === 'returnDateTime' && parsedDate <= parse(goingOutDateTime, 'dd/MM/yy HH', referenceDate)) throw Error("Parsed return trip date is before departure date and time")
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

export const getDifferentFields = (prevQuery, curQuery) => {
	let importantFields = ['origin', 'destination', 'dateTime', 'returnDateTime', 'passengers', 'noAR']
	return importantFields.filter(field => prevQuery[field] !== curQuery[field])
}		

export const stationNameToCamelcase = str => {
	let newStr = str.replaceAll(' ','');
	newStr = newStr.charAt(0).toLowerCase() + newStr.slice(1);
	return newStr
}

export const post = async (path, body) => {
	let response = await fetch(path, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		},
		body: body
	})
	if (!response.ok){
		console.log('Response was not ok while submitting');
		return
	}
	return await response.json()
}

export const getRequestBodyForBothReturns = (formData, prevQuery) => {
    let {origin, destination, dateTime, returnDateTime, passengers} = formData;
    let {cartId, trainId, cookies: trenitaliaCookies} = prevQuery.return.trenitalia;
    let {inputValue, cookies: italoCookies} = prevQuery.return.italo;
    return {origin, destination, dateTime, returnDateTime, passengers, goingoutId: trainId, cartId, trenitaliaCookies, inputValue, italoCookies}
}

/*
const trenitaliaReturnRequest = async (formData, prevQuery, setTrains) => {
    let {origin, destination, dateTime, returnDateTime, passengers} = formData;
    let {cartId, trainId, cookies} = prevQuery.return.trenitalia;
    let requestBody = {origin, destination, dateTime, returnDateTime, passengers, goingoutId: trainId, cartId, cookies, company: 'trenitalia'}
    let results = await post('/aerr', requestBody)
    setTrains(prev => ({...prev, returning: results}))
}
const getTrenitaliaRequestBody = (formData, prevQuery, setTrains) => {

}
const italoReturnRequest = async (formData, prevQuery, setTrains) => {
    let {origin, destination, dateTime, returnDateTime, passengers} = formData;
    let {inputValue, cookies} = prevQuery.return.italo;
    let requestBody = {origin, destination, dateTime, returnDateTime, passengers, goingoutId: inputValue, cookies, company: 'italo'} // ? don't like the input value getting renamed to 'id'
    let results = await post('/aerr', requestBody)
    setTrains(prev => ({...prev, returning: results}))
}

*/