import {useState, useEffect} from 'react';
import departureTimeSort from './departureTimeSort.js';
import {post as postWithoutDispatch, stationNameToCamelcase} from './formSubmit'
import {State, Action, Train} from './App';

const ResultsList = ({state, dispatch} : {state:State, dispatch: (action: Action) => void }) => {
	let [sortOrder, setSortOrder] = useState({by: 'departureTime', asc: 1});
	let [showMore, setShowMore] = useState('none')

	let results = state.trains.outgoing;
	const post = async (path:string, body:BodyInit, returning:boolean) => {
		return await postWithoutDispatch(path, body, returning, dispatch);
	}

	const toggleShowMore = () => {
		setShowMore(oldVal => oldVal === 'none' ? 'table-cell' : 'none')
	}

	// TODO When you click on a new field it instead just notices another click on the previous field before moving to the new one

	const sortResults = (key:keyof Train) => {
		updateSortOrder(key);
	}
	const updateSortOrder = (key: keyof Train) => {
		if (sortOrder.by === key){
			console.log(`setting order to {by: ${sortOrder.by}, asc: ${-1*sortOrder.asc}}`)
			setSortOrder(oldOrder => ({by: oldOrder.by, asc: -1*oldOrder.asc}))
		} else {
			console.log(`setting order to {by: ${key}, asc: 1}`)
			setSortOrder({by: key, asc: 1});
		}
	}
	const priceSort = (a:number|string,b:number|string,asc:number) => {
		if (a > b){
			return asc;
		} else if (b > a) {
			return -1*asc;
		}
		return 0;
	}

	const arrivalTimeSort = (a:Train,b:Train,asc:number) => {
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

	const durationSort = (a:Train, b:Train, asc: number) => {
		let [durationTimeA, durationTimeB] = [a,b].map(train => parseInt(train.duration.replace(':','')));
		if (durationTimeA === durationTimeB) return 0;
		return asc * (durationTimeA > durationTimeB ? 1 : -1);
	}

	const applySortOrder = () => {
		let newOrder;
		switch(sortOrder.by){
			case 'departureTime':
				newOrder = results;
				newOrder.sort((a,b) => departureTimeSort(a,b,sortOrder.asc));
				dispatch({type: 'reorderResults', payload: {direction: 'outgoing', newOrder}});
				break;
			case 'arrivalTime':
				newOrder = results;
				newOrder.sort((a,b) => arrivalTimeSort(a,b,sortOrder.asc));
				dispatch({type: 'reorderResults', payload: {direction: 'outgoing', newOrder}});
				break;
			case 'minPrice':
				newOrder = results;
				console.log(results.map(result => result.minPrice));
				newOrder.sort((a,b) => priceSort(a.minPrice,b.minPrice,sortOrder.asc));
				console.log(typeof results[0].minPrice);
				dispatch({type: 'reorderResults', payload: {direction: 'outgoing', newOrder}});
				break;
			case 'company':
				newOrder = results;
				newOrder.sort((a,b) => a.company > b.company ? sortOrder.asc : (b.company > a.company ? -1 * sortOrder.asc : 0));
				dispatch({type: 'reorderResults', payload: {direction: 'outgoing', newOrder}});
				break;
			case 'duration':
				newOrder = results;
				newOrder.sort((a,b) => durationSort(a,b,sortOrder.asc));
				dispatch({type: 'reorderResults', payload: {direction: 'outgoing', newOrder}});
				break;
			default:
				return;
		}
	}
	useEffect(() => {
		applySortOrder()
		console.log(sortOrder)
	}, [sortOrder]) // is this wrong?

	function addRoundtripPrices(reqResults: { results: Train[]}, returningTrains:Train[], company:'italo'|'trenitalia'){
		reqResults.results.sort((a,b) => departureTimeSort(a,b,1));
		let companyReturnTrains = state.trains.returning.filter(train => train.company === company)
		for (let newTrainData of reqResults.results){
			let matchFound = false;
			for (let trainData of companyReturnTrains){
				if (newTrainData.departureTime === trainData.departureTime && newTrainData.arrivalTime === trainData.arrivalTime){
					trainData.returnMinPrice = newTrainData.minPrice;
					matchFound = true;
					break;
				}
			}
			if (!matchFound) companyReturnTrains.push(newTrainData)
		}
		let newReturningTrains = [...returningTrains.filter(train => train.company !== company), ...companyReturnTrains].sort((a,b) => departureTimeSort(a,b,1))
		return newReturningTrains;
	}

	const searchReturn = async (train:Train) => {
		if (state.trains.chosen[train.company] === train){
			console.log('The train you clicked on is already the one selected')
			return;
		}
		const {prevQuery: {formData: {origin, destination, dateTime, returnDateTime, passengers}, time}, metadata: { italo: { cookies: italoCookies }, trenitalia: {cookies: trenitaliaCookies, cartId}}} = state;
		if ((Date.now() - time)/1000 > 300) 
			console.log('More than 5 minutes passed since original request, might be too much!')
		let requestBodyBase = {origin: stationNameToCamelcase(origin), destination: stationNameToCamelcase(destination), dateTime, returnDateTime, passengers, company: train.company}
		let requestBody;
		let reqResults;
		if (train.company === 'trenitalia')
			requestBody = {...requestBodyBase, goingoutId: train.id, cartId, cookies: trenitaliaCookies}
		else 
			requestBody = {...requestBodyBase, inputValue: train.inputValue, cookies: italoCookies}
		try {
			reqResults = await post('/return', JSON.stringify(requestBody), true)
			if(!reqResults) return;
			if (reqResults.results.length){
				let newReturningTrains = addRoundtripPrices(reqResults, state.trains.returning, train.company)
				let chosen = {...state.trains.chosen,  [train.company]: train}
				dispatch({type: 'selectOutgoingTrip', payload: {returning: newReturningTrains, chosen, error: reqResults.error}})
			} else 
				dispatch({type: 'setError', payload: {error: reqResults.error}});
		} catch (e) {
			console.log('request for '+train.company+' returns failed')
			//console.log('python3 splitA.py '+[requestBody.origin, requestBody.destination, ...requestBody.dateTime.replaceAll('/','-').split(' '), requestBody.passengers, ...requestBody.returnDateTime.replaceAll('/','-').split(' ')].join(' '))
		}
	}

	let roundtrip = state.prevQuery.formData.returnDateTime;
	let tableRows = results.map((result:Train) => {
		let className = ''
		if (state.trains.chosen[result.company]?.id){
			className = state.trains.chosen[result.company]?.id === result.id ? (result.company === 'italo' ? 'italoSelected' : 'trenitaliaSelected') : ''
		}
		return (
			<tr key={result.id} className={className} onDoubleClick={roundtrip ? searchReturn.bind(null, result) : undefined}>
				<td>{result.departureTime}</td>
				<td>{result.arrivalTime}</td>
				<td>{result.duration}</td>
				<td>{result.minPrice}</td>
				<td className='companyCol'>{result.company}</td>
				<td style={{display: showMore}} >{result.minIndividualPrice}</td>
				<td style={{display: showMore}} >{result.young}</td>
				<td style={{display: showMore}} >{result.senior}</td>
				<td style={{display: showMore}} >{result.adult}</td>
			</tr>
		)
	})
	

	return (
		<div className='tableDiv'>
		<h2>Andata</h2>
		<table className={state.trains?.returning.length ? '' : 'fullWidth'}>
		<thead>
			<tr>
				<th onClick={() => sortResults('departureTime')} >Partenza</th>
				<th onClick={sortResults.bind(null, 'arrivalTime')} >Arrivo</th>
				<th onClick={sortResults.bind(null, 'duration')} >Durata</th>
				<th onClick={sortResults.bind(null, 'minPrice')} >Prezzo</th>
				<th className='companyCol' onClick={sortResults.bind(null, 'company')} >Azienda <span style={{display: showMore === 'table-cell' ? 'none' : 'inline'}} onClick={toggleShowMore}>&#8594;</span></th>
				<th style={{display: showMore}} onClick={sortResults.bind(null, 'minIndividualPrice')} >Single</th>
				<th style={{display: showMore}} onClick={sortResults.bind(null, 'young')} >Adult</th>
				<th style={{display: showMore}} onClick={sortResults.bind(null, 'senior')} >Young</th>
				<th style={{display: showMore}} onClick={sortResults.bind(null, 'adult')} >Senior<span onClick={toggleShowMore}>&#8592;</span></th>
			</tr>
		</thead>
			<tbody>
				{tableRows}
			</tbody>
		</table>
		</div>
	)
}

export default ResultsList;
