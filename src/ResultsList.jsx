import {useState} from 'react';
import departureTimeSort from './departureTimeSort.js';
import {post as postWithoutDispatch, stationNameToCamelcase} from './formSubmit'

const ResultsList = ({state, dispatch, style}) => {
	let [sortOrder, setSortOrder] = useState({by: 'departureTime', asc: 1});
	let [showMore, setShowMore] = useState('none')

	let results = state.trains.outgoing;
	const post = async (path,body,returning) => {
		return await postWithoutDispatch(path, body, returning, dispatch);
	}

	const toggleShowMore = () => {
		setShowMore(oldVal => oldVal === 'none' ? 'table-cell' : 'none')
	}
	const sortResults = key => {
		updateSortOrder(key);
		applySortOrder()
		console.log(sortOrder)
	}
	const updateSortOrder = (key) => {
		if (sortOrder.by === key){
			setSortOrder(oldOrder => ({...oldOrder, asc: -1*oldOrder.asc}))
		} else {
			setSortOrder({by: key, asc: 1});
		}
	}
	const applySortOrder = () => {
		let newOrder;
		switch(sortOrder.by){
			case 'departureTime':
				newOrder = results;
				newOrder.sort((a,b) => departureTimeSort(a,b,sortOrder.asc));
				dispatch({type: 'reorderResults', payload: {direction: 'outgoing', newOrder}});
				break;
			default:
				return;
		}
	}

	function addRoundtripPrices(reqResults, returningTrains, company){
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

	const searchReturn = async (train) => {
		if (state.trains.chosen[train.company] === train){
			console.log('The train you clicked on is already the one selected')
			return;
		}
		const {prevQuery: {formData: {origin, destination, dateTime, returnDateTime, passengers}, time}, metadata: { italo: { cookies: italoCookies }, trenitalia: {cookies: trenitaliaCookies, cartId}}} = state;
		if ((Date.now() - time)/1000 > 300) 
			console.log('More than 5 minutes passed since original request, might be too much!')
		let requestBody = {origin: stationNameToCamelcase(origin), destination: stationNameToCamelcase(destination), dateTime, returnDateTime, passengers, company: train.company}
		let reqResults;
		if (train.company === 'trenitalia')
			requestBody = {...requestBody, goingoutId: train.id, cartId, cookies: trenitaliaCookies}
		else 
			requestBody = {...requestBody, inputValue: train.inputValue, cookies: italoCookies}
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
	let tableRows = results.map(result => {
		let className = state.trains.chosen[result.company]?.id === result.id ? (result.company === 'italo' ? 'italoSelected' : 'trenitaliaSelected') : ''
		return (
			<tr key={result.id} className={className} onDoubleClick={roundtrip ? searchReturn.bind(null, result) : undefined}>
				<td>{result.departureTime}</td>
				<td>{result.arrivalTime}</td>
				<td>{result.duration}</td>
				<td>{result.minPrice}</td>
				<td>{result.company}</td>
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
				<th>Arrivo</th>
				<th>Durata</th>
				<th>Prezzo</th>
				<th>Azienda <span style={{display: showMore === 'table-cell' ? 'none' : 'inline'}} onClick={toggleShowMore}>&#8594;</span></th>
				<th style={{display: showMore}}>Single</th>
				<th style={{display: showMore}}>Adult</th>
				<th style={{display: showMore}}>Young</th>
				<th style={{display: showMore}}>Senior<span onClick={toggleShowMore}>&#8592;</span></th>
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
