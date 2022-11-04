import parse from 'date-fns/parse';
import format from 'date-fns/format';
import { State, Action, Train } from './types';
import { Dispatch, SetStateAction } from 'react';

export const shortenedStationNames = {
	'Milano Centrale': 'Milano C.',
	'Reggio Emilia': 'Reggio E.',
	'Bologna': 'Bologna',
	'Firenze': "Firenze",
	'Roma Termini': "Roma Ter.",
	'Roma Tiburtina': "Roma Tib.",
	'Napoli Centrale': "Napoli C.",
	'Napoli Afragola': "Napoli A.",
	'Salerno': "Salerno",
	'Vallo della Lucania': "Vallo"
};

export const acceptedStations = ['Milano Centrale', 'Reggio Emilia', 'Bologna', 'Firenze', 'Roma Termini', 'Roma Tiburtina', 'Napoli Centrale', 'Napoli Afragola', 'Salerno', 'Vallo della Lucania'];
export const getResults = async (formData: State["prevQuery"]["formData"], prevFormData: State["prevQuery"]["formData"], dispatch: (action: Action) => void) => {
	let oneWay = !formData.returnDateTime;
	let differentFields: string[] | [] = getDifferentFields(prevFormData, formData)
	if (differentFields.length === 0)
		return;
	let currentTimestamp = Date.now()
	let query = { formData, time: currentTimestamp }
	let origin = stationNameToCamelcase(formData.origin)
	let destination = stationNameToCamelcase(formData.destination)
	let results

	if (oneWay) {
		console.log('making search')
		let reqBody = { ...formData, origin, destination }
		results = await post('/outgoingOnly', JSON.stringify(reqBody), false, dispatch) // File to run is the simple one that just return lines
		if (!results) return;
		results.results.sort((a: Train, b: Train) => departureTimeSort(a, b, 1));
		dispatch({ type: 'onewaySearch', payload: { query, outgoing: results.results, error: results.error } })

	} else {
		if (differentFields.length === 1 && differentFields[0] === 'returnDateTime') {
			// should check if already chosen selected
			let body = { ...formData, origin: destination, destination: origin } // swapped them because I'm looking for return trips, no?
			results = await post('/outgoingOnly', JSON.stringify(body), true, dispatch) // simple script no metadata since only return search
			if (!results) return;
			results.results.sort((a: Train, b: Train) => departureTimeSort(a, b, 1));
			dispatch({ type: 'returnTimeUpdate', payload: { query, error: results.error, returning: results.results } });
		} else {
			let body = { ...formData, origin, destination }
			results = await post('/allNoOffers', JSON.stringify(body), false, dispatch) // this needs to return metadata
			if (!results) return;
			results.results.outgoing.sort((a: Train, b: Train) => departureTimeSort(a, b, 1));
			results.results.returning.sort((a: Train, b: Train) => departureTimeSort(a, b, 1));
			dispatch({ type: 'roundtripSearch', payload: { query, error: results.error, outgoing: results.results.outgoing, returning: results.results.returning, metadata: results.metadata } })
		}
	}
}


export function getMinOutgoingPrice(outgoingTrains: State['trains']['chosen']): number {
	if (outgoingTrains.italo && outgoingTrains.trenitalia) return Math.min(outgoingTrains.italo?.minPrice, outgoingTrains.trenitalia?.minPrice)
	return (outgoingTrains.italo?.minPrice ?? outgoingTrains.trenitalia!.minPrice) // ! used because I know at least 1 is defined (used to search)
}

export function addRoundtripPrices(reqResults: { results: Train[] }, returningTrains: Train[], outgoingTrains: State['trains']['chosen'], company: 'italo' | 'trenitalia') {
	reqResults.results.sort((a, b) => departureTimeSort(a, b, 1)); // if I sort one list I should also sort the other, othewise what's the point? also I should remove from the list trains thta have been matched
	let [sameCompanyReturnTrains, otherCompanyReturnTrains] = partition(returningTrains, train => train.company === company);
	sameCompanyReturnTrains.sort((a, b) => departureTimeSort(a, b, 1));
	let outgoingTrain: Train = outgoingTrains[company]!; // This should always be defined because it's the train from which search results were generated
	for (let newTrainData of reqResults.results) {
		let matchingTrain: Train | false = binarySearch(sameCompanyReturnTrains, newTrainData, departureTimeSort);
		if (!matchingTrain) {
			console.log(newTrainData)
			newTrainData.minRoundtripPrice = newTrainData.minPrice;
			newTrainData.totPrice = Math.round((newTrainData.minPrice + outgoingTrain.minPrice) * 10) / 10;
			sameCompanyReturnTrains.push(newTrainData) // train found in return trains req was not found in first req for (one way) coming back trains?
		} else {
			matchingTrain.minRoundtripPrice = newTrainData.minPrice;
			if (matchingTrain.minOnewayPrice === undefined) matchingTrain.minOnewayPrice = matchingTrain.minPrice;
			matchingTrain.minPrice = Math.min(matchingTrain.minOnewayPrice, matchingTrain.minRoundtripPrice);
			let minOutgoingPrice = getMinOutgoingPrice(outgoingTrains);
			if (matchingTrain.minOnewayPrice <= matchingTrain.minRoundtripPrice) { // no AR offers, can also choose outgoing train of other company
				matchingTrain.totPrice = Math.round((minOutgoingPrice + matchingTrain.minPrice) * 10) / 10;
			} else {
				let minMixedPrice = minOutgoingPrice + matchingTrain.minOnewayPrice;
				let minRoundtripPrice = outgoingTrain.minPrice + matchingTrain.minRoundtripPrice;
				matchingTrain.totPrice = Math.min(minMixedPrice, minRoundtripPrice);
			}
		}
	}
	let newReturningTrains = [...otherCompanyReturnTrains, ...sameCompanyReturnTrains].sort((a, b) => departureTimeSort(a, b, 1))
	return newReturningTrains;
}


export function partition<Type>(array: Type[], isValid: (elem: Type) => boolean): [Type[], Type[]] {
	return array.reduce(([pass, fail], elem) => {
		return isValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
	}, [[], []] as [Type[], Type[]]);
}

export const updateSortOrder = (key: keyof Train, setSortOrder: Function) => {
	setSortOrder((oldOrder: { by: string, asc: number }) => {
		if (oldOrder.by === key) {
			return { by: oldOrder.by, asc: -1 * oldOrder.asc };
		} else {
			return { by: key, asc: 1 }
		}
	})
}

export const applySortOrder = (sortOrder: { by: string, asc: number }, trains: Train[]) => {
	const { asc, by } = sortOrder;
	let newOrder;
	newOrder = trains;
	switch (by) {
		case 'departureTime':
			newOrder.sort((a, b) => departureTimeSort(a, b, asc));
			break;
		case 'arrivalTime':
			newOrder.sort((a, b) => arrivalTimeSort(a, b, asc));
			break;
		case 'minPrice':
		case 'totPrice':
			newOrder.sort((a, b) => priceSort(a[by], b[by], asc));
			break;
		case 'company':
			newOrder.sort((a, b) => a.company > b.company ? asc : (b.company > a.company ? -1 * asc : 0));
			break;
		case 'duration':
			newOrder.sort((a, b) => durationSort(a, b, asc));
			break;
		default:
			throw new Error(`applySortOrder was called with a key that it's not supposed to handle: ${by}`);
	}
	return newOrder;
	// reorderResults(newOrder);
}

export function binarySearch<Type>(array: Type[], element: Type, compareFn: (a: Type, b: Type, asc: number) => number, asc: number = 1): Type | false {
	let halfPoint = Math.round((array.length - 1) / 2);
	let comparisonResult = compareFn(array[halfPoint], element, asc);
	// console.log(array, comparisonResult)
	if (array.length === 1) return (comparisonResult === 0 ? array[0] : false);

	if (comparisonResult === 1) { // this takes the lower value if length is even, on 4 elements it takes 1 etc
		return binarySearch(array.slice(0, halfPoint), element, compareFn)
	} else if (comparisonResult === -1) {
		return binarySearch(array.slice(halfPoint, array.length), element, compareFn);
	} else {
		return array[halfPoint];
	}
}


export const priceSort = (a: number | string | undefined, b: number | string | undefined, asc: number) => {
	if (a === undefined) return 1;
	if (b === undefined) return -1;
	if (a > b) {
		return asc;
	} else if (b > a) {
		return -1 * asc;
	}
	return 0;
}

export const departureTimeSort = (a: Train, b: Train, asc: number) => {
	let [departureTimeNumA, departureTimeNumB] = [a, b].map(item => parseInt(item.departureTime.replace(':', '')))
	if (departureTimeNumA === departureTimeNumB) return 0
	return asc * (departureTimeNumA > departureTimeNumB ? 1 : -1);
}

export const arrivalTimeSort = (a: Train, b: Train, asc: number) => {
	let [arrivalTimeNumA, arrivalTimeNumB] = [a, b].map(item => {
		let timeString = item.arrivalTime.replace(':', '');
		let hourInt = parseInt(timeString.slice(0, 2));
		if (hourInt >= 0 && hourInt <= 5) {  // exception hours are between 0 and 5
			return (parseInt(timeString) + 2400);
		}
		return parseInt(item.departureTime.replace(':', ''));
	})
	if (arrivalTimeNumA === arrivalTimeNumB) return 0
	return asc * (arrivalTimeNumA > arrivalTimeNumB ? 1 : -1);
}

export const durationSort = (a: Train, b: Train, asc: number) => {
	let [durationTimeA, durationTimeB] = [a, b].map(train => parseInt(train.duration.replace(':', '')));
	if (durationTimeA === durationTimeB) return 0;
	return asc * (durationTimeA > durationTimeB ? 1 : -1);
}

type validFormFields = {
	[key in keyof State['prevQuery']["formData"]]: boolean;
}

export const validateData = (data: { dateTime: string, returnDateTime: string, origin: string, destination: string, passengers: string }, setFormData: Dispatch<SetStateAction<State['prevQuery']['formData']>>, acceptedStations: string[], setValidFields: (fields: validFormFields) => void) => {
	let dataValid = true;
	let validFields = { origin: true, destination: true, dateTime: true, returnDateTime: true, passengers: true };
	if (!validateDateTime(data.dateTime, setFormData)) {
		dataValid = false;
		validFields.dateTime = false;
	}
	if (data.returnDateTime && !validateDateTime(data.returnDateTime, setFormData, data.dateTime)) {
		dataValid = false;
		validFields.returnDateTime = false;
	}
	if (!acceptedStations.includes(data.origin)) {
		console.log(data.origin + ' is not a valid station name')
		dataValid = false;
		validFields.origin = false;
	}
	if (!acceptedStations.includes(data.destination)) {
		console.log(data.destination + ' is not a valid station name')
		dataValid = false;
		validFields.destination = false;
	}
	const passengersAcceptedPatterns = [/^[0-9][1-9][0-9]$/, /^[1-9][0-9]{2}$/, /^[0-9]{2}[1-9]$/];
	if (passengersAcceptedPatterns.every(pattern => data.passengers.match(pattern) === null)) {
		console.log("Passengers data is not valid")
		dataValid = false;
		validFields.passengers = false;
	}
	setValidFields(validFields);
	return dataValid;
}

// This needs string to parse, fieldname to understand if it's a return date or going out, the going out date if it's parsing a return date, wants setformdata to set the format to the correct one
// I could just pass string and an optional goingout date string to differentiate the fieldname, if I want this function to correct the data I need access to the setter.
// If this was only used directly by the form I could return the data to be set but it sometimes gets called by a middleman like validatedata
export function validateDateTime(str: string, setFormData: Dispatch<SetStateAction<State['prevQuery']['formData']>>, goingOutDateTime = '') {
	const referenceDate = new Date();
	referenceDate.setHours(referenceDate.getHours() + 1, 0, 0, 0);
	const acceptedDateTimeFormats = ["dd/MM/yy HH", "dd/MM/yy", 'dd/MM HH', 'dd/MM']
	let errorText = ''
	let fieldName = goingOutDateTime === '' ? 'dateTime' : 'returnDateTime';

	for (let possibleFormat of acceptedDateTimeFormats) {
		try {
			let parsedDate: Date = parse(str, possibleFormat, referenceDate)
			if (isNaN(parsedDate.valueOf())) throw Error("Invalid date"); // had to add .valueOf which is implicitly called by isNan to convert to number cause typescript was complaining
			if (possibleFormat === 'dd/MM/yy' || possibleFormat === 'dd/MM') {
				if (fieldName === 'dateTime') {
					if (format(parsedDate, possibleFormat) === format(referenceDate, possibleFormat)) parsedDate.setHours(referenceDate.getHours())
					else parsedDate.setHours(8);
				} else {
					let depDateTimeObject = parse(goingOutDateTime, 'dd/MM/yy HH', referenceDate)
					if (format(parsedDate, possibleFormat) === format(depDateTimeObject, possibleFormat)) parsedDate.setHours(depDateTimeObject.getHours() + 1)
					else parsedDate.setHours(8);
				}
			}
			if (parsedDate < referenceDate) throw Error("Parsed date is before current date and time")
			if (fieldName === 'returnDateTime' && parsedDate <= parse(goingOutDateTime, 'dd/MM/yy HH', referenceDate)) throw Error("Parsed return trip date is before departure date and time")
			setFormData((formData: State['prevQuery']['formData']) => ({ ...formData, [fieldName]: format(parsedDate, 'dd/MM/yy HH') }));
			return true
		} catch (err) {
			if (typeof err === 'string') errorText += err
			else if (err instanceof Error) errorText += `Error: ${err.message} while parsing date: ${str} with format ${possibleFormat}\n`;
		}
	}
	console.log(errorText)
	setFormData((formData: State['prevQuery']['formData']) => ({ ...formData, [fieldName]: '' }));
	return false
}

export const getDifferentFields = (prevFormData: State['prevQuery']['formData'], curFormData: State['prevQuery']['formData']) => {
	let importantFields: (keyof State['prevQuery']['formData'])[] = ['origin', 'destination', 'dateTime', 'returnDateTime', 'passengers']
	return importantFields.filter(field => prevFormData[field] !== curFormData[field])
}

export const stationNameToCamelcase = (str: string) => {
	let newStr = str.replaceAll(' ', '');
	newStr = newStr.charAt(0).toLowerCase() + newStr.slice(1);
	return newStr
}

export const post = async (path: string, body: BodyInit, returning: boolean, dispatch: (action: Action) => void) => {
	if (returning) dispatch({ type: 'toggleLoading' });
	else dispatch({ type: 'toggleLoadingAndReset' });
	try {
		let response = await fetch(`https://api.tf.bravewonderer.com${path}`, {
			//let response = await fetch(`http://localhost:3003${path}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: body
		})
		if (!response.ok) {
			throw Error(`After posting to ${path} response was not ok`)
		}
		return await response.json()
	} catch (e) {
		let errorMessage;
		if (e instanceof Error)
			errorMessage = e.message
		else if (typeof e === 'string')
			errorMessage = e
		else errorMessage = 'Received an error that was neither Error type nor string';
		console.log(errorMessage)
		if (!returning)
			dispatch({ type: 'requestFail', payload: { reqType: 'outgoing', error: errorMessage } });
		else
			dispatch({ type: 'requestFail', payload: { reqType: 'returning', error: errorMessage } });
	}
}

// Normally I: parse formdata, decide whether to make a request.
// if I make the req: do req -> 'process data' -> if there is an error ? if there is no data? 
// if req fails ? don't do anything rn

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
