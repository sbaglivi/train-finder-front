import parse from 'date-fns/parse';
import format from 'date-fns/format';
import {State, Action, Train} from './App';
import {Dispatch, SetStateAction} from 'react';

export const updateSortOrder = (key: keyof Train, setSortOrder:Function) => {
	setSortOrder((oldOrder:{by: string, asc:number}) => {
		if (oldOrder.by === key){
			return {by: oldOrder.by, asc: -1*oldOrder.asc};
		} else {
			return {by: key, asc: 1}
		}
	})
}

export const applySortOrder = (sortOrder : {by: string, asc: number}, results: Train[], reorderResults:Function) => {
	const {asc, by} = sortOrder;
	let newOrder;
	newOrder = results;
	switch(by){
		case 'departureTime':
			newOrder.sort((a,b) => departureTimeSort(a,b,asc));
			break;
		case 'arrivalTime':
			newOrder.sort((a,b) => arrivalTimeSort(a,b,asc));
			break;
		case 'minPrice':
		case 'returnMinPrice':
		case 'totPrice':
			newOrder.sort((a,b) => priceSort(a[by], b[by], asc));
			break;
		case 'company':
			newOrder.sort((a,b) => a.company > b.company ? asc : (b.company > a.company ? -1 * asc : 0));
			break;
		case 'duration':
			newOrder.sort((a,b) => durationSort(a,b,asc));
			break;
		default:
			return;
	}
	reorderResults(newOrder);
}

export function binarySearch<Type> (array: Type[], element: Type, compareFn: (a: Type, b: Type, asc: number) => number, asc: number = 1) : Type | false {
	let halfPoint = Math.round((array.length-1)/2);
	let comparisonResult = compareFn(array[halfPoint], element, asc);
	// console.log(array, comparisonResult)
	if (array.length === 1) return ( comparisonResult === 0 ? array[0] : false);

	if (comparisonResult === 1){ // this takes the lower value if length is even, on 4 elements it takes 1 etc
		return binarySearch(array.slice(0, halfPoint), element, compareFn)
	} else if (comparisonResult === -1 ) {
		return binarySearch(array.slice(halfPoint, array.length), element, compareFn);
	} else {
		return array[halfPoint];
	}
}


export const priceSort = (a:number|string|undefined, b:number|string|undefined, asc:number) => {
	if (a === undefined) return 1;
	if (b === undefined) return -1;
	if (a > b){
		return asc;
	} else if (b > a) {
		return -1*asc;
	}
	return 0;
}

export const departureTimeSort = (a:Train,b:Train,asc:number) => {
	let [departureTimeNumA, departureTimeNumB] = [a,b].map(item => parseInt(item.departureTime.replace(':','')))
	if (departureTimeNumA === departureTimeNumB) return 0
	return asc * (departureTimeNumA > departureTimeNumB ? 1 : -1);
}

export const arrivalTimeSort = (a:Train,b:Train,asc:number) => {
	let [arrivalTimeNumA, arrivalTimeNumB] = [a,b].map(item => {
		let timeString = item.arrivalTime.replace(':','');
		let hourInt = parseInt(timeString.slice(0,2));
		if (hourInt >= 0 && hourInt <= 5){  // exception hours are between 0 and 5
			return (parseInt(timeString)+ 2400);
		}
		return parseInt(item.departureTime.replace(':',''));
	})
	if (arrivalTimeNumA === arrivalTimeNumB) return 0
	return asc * (arrivalTimeNumA > arrivalTimeNumB ? 1 : -1);
}

export const durationSort = (a:Train, b:Train, asc: number) => {
	let [durationTimeA, durationTimeB] = [a,b].map(train => parseInt(train.duration.replace(':','')));
	if (durationTimeA === durationTimeB) return 0;
	return asc * (durationTimeA > durationTimeB ? 1 : -1);
}

export const validateData = (data:{dateTime:string, returnDateTime:string, origin: string, destination: string, passengers: string}, setFormData: Dispatch<SetStateAction<State['prevQuery']['formData']>>, acceptedStations:string[]) => {
	if (!validateDateTime(data.dateTime, setFormData))
		return false
	if (data.returnDateTime && !validateDateTime(data.returnDateTime, setFormData, data.dateTime))
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
export function validateDateTime(str:string, setFormData:Dispatch<SetStateAction<State['prevQuery']['formData']>>, goingOutDateTime=''){
	const referenceDate = new Date();
	referenceDate.setHours(referenceDate.getHours()+1, 0, 0, 0);
	const acceptedDateTimeFormats = ["dd/MM/yy HH", "dd/MM/yy", 'dd/MM HH', 'dd/MM']
	let errorText = ''
    let fieldName = goingOutDateTime === '' ? 'dateTime' : 'returnDateTime';

	for (let possibleFormat of acceptedDateTimeFormats){
		try {
			let parsedDate:Date = parse(str, possibleFormat, referenceDate)
			if (isNaN(parsedDate.valueOf())) throw Error("Invalid date"); // had to add .valueOf which is implicitly called by isNan to convert to number cause typescript was complaining
			if (possibleFormat === 'dd/MM/yy' || possibleFormat === 'dd/MM'){
				if (fieldName === 'dateTime'){
					if (format(parsedDate, possibleFormat) === format(referenceDate, possibleFormat)) parsedDate.setHours(referenceDate.getHours())
					else parsedDate.setHours(8);
				} else {
					let depDateTimeObject = parse(goingOutDateTime, 'dd/MM/yy HH', referenceDate)
					if (format(parsedDate, possibleFormat) === format(depDateTimeObject, possibleFormat)) parsedDate.setHours(depDateTimeObject.getHours()+1)
					else parsedDate.setHours(8);
				}
			}
			if (parsedDate < referenceDate) throw Error("Parsed date is before current date and time")
			if (fieldName === 'returnDateTime' && parsedDate <= parse(goingOutDateTime, 'dd/MM/yy HH', referenceDate)) throw Error("Parsed return trip date is before departure date and time")
			setFormData((formData:State['prevQuery']['formData']) => ({...formData, [fieldName]: format(parsedDate, 'dd/MM/yy HH')}));
			return true
		} catch (err) {
			if (typeof err === 'string') errorText += err
			else if (err instanceof Error) errorText += `Error: ${err.message} while parsing date: ${str} with format ${possibleFormat}\n`;
		}
	}
	console.log(errorText)
	setFormData((formData:State['prevQuery']['formData']) => ({...formData, [fieldName]: ''}));
	return false
}

export const getDifferentFields = (prevFormData:State['prevQuery']['formData'], curFormData:State['prevQuery']['formData']) => {
	let importantFields: (keyof State['prevQuery']['formData'])[] = ['origin', 'destination', 'dateTime', 'returnDateTime', 'passengers']
	return importantFields.filter(field => prevFormData[field] !== curFormData[field])
}		

export const stationNameToCamelcase = (str:string) => {
	let newStr = str.replaceAll(' ','');
	newStr = newStr.charAt(0).toLowerCase() + newStr.slice(1);
	return newStr
}

export const post = async (path:string, body:BodyInit, returning:boolean, dispatch: (action: Action) => void) => {
	if (returning) dispatch({type: 'toggleLoading'});
	else dispatch({type: 'toggleLoadingAndReset'});
	try {
		let response = await fetch(`http://localhost:3003${path}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: body
		})
		if (!response.ok){
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
			dispatch({type: 'requestFail', payload: {reqType: 'outgoing', error: errorMessage}});
		else 
			dispatch({type: 'requestFail', payload:{reqType: 'returning', error: errorMessage}});
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
