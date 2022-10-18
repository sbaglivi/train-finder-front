import {useState, useEffect} from 'react';
import {post as postWithoutDispatch, stationNameToCamelcase, departureTimeSort, updateSortOrder, applySortOrder, binarySearch} from './utilityFunctions'
import {State, Action, Train} from './App';
import { intervalToDuration } from 'date-fns';


const ResultsList = ({state, dispatch, saveTrain} : {state:State, dispatch: (action: Action) => void, saveTrain: (train: Train, invert: boolean) => void }) => {
	let [sortOrder, setSortOrder] = useState({by: 'departureTime', asc: 1});
	let [showMore, setShowMore] = useState('none')

	let results = state.trains.outgoing;
	const post = async (path:string, body:BodyInit, returning:boolean) => {
		return await postWithoutDispatch(path, body, returning, dispatch);
	}

	const toggleShowMore = () => {
		setShowMore(oldVal => oldVal === 'none' ? 'table-cell' : 'none')
	}

	const reorderResults = (newOrder: Train[]) => {
		dispatch({type: 'reorderResults', payload: {direction: 'outgoing', newOrder}});
	}

	useEffect(() => {
		applySortOrder(sortOrder, results, reorderResults);
		console.log(sortOrder)
	}, [sortOrder]) // is this wrong?

	function getMinPriceIfExists(train:Train){
		if  (typeof train.minPrice === 'number'){
			if (typeof train.minRoundtripPrice === 'number') return Math.min(train.minRoundtripPrice, train.minPrice);
			else return train.minPrice
		}
		return false;
	}

	function getMinOutgoingPrice(outgoingTrains: State['trains']['chosen']):number{ // at least one of the two is NOT undefined
		if (outgoingTrains.italo === undefined){
			return outgoingTrains.trenitalia!.minPrice; // ! used because I know at least 1 is defined
		} else {
			if (outgoingTrains.trenitalia === undefined) return outgoingTrains.italo.minPrice;
			return Math.min(outgoingTrains.italo.minPrice, outgoingTrains.trenitalia.minPrice);
		}
	}

	function addRoundtripPrices(reqResults: { results: Train[]}, returningTrains:Train[], outgoingTrains: State['trains']['chosen'], company: 'italo' | 'trenitalia'){
		reqResults.results.sort((a,b) => departureTimeSort(a,b,1)); // if I sort one list I should also sort the other, othewise what's the point? also I should remove from the list trains thta have been matched
		let companyReturnTrains = state.trains.returning.filter(train => train.company === company).sort((a,b) => departureTimeSort(a,b,1));
		let outgoingTrain:Train = outgoingTrains[company]!; // This should always be defined because it's the train from which search results were generated
		for (let newTrainData of reqResults.results){
			// for some hellish reason if I defined the result of binarySearch as Type | Boolean (or Type | false) it would not work
			// Hellish reason is probably that Boolean is a keyword for something else and boolean is the normal type. fml
			let matchingTrain: Train | false = binarySearch(companyReturnTrains, newTrainData, departureTimeSort);

			if (!matchingTrain){
				console.log(matchingTrain);
				console.log(newTrainData)
				newTrainData.minRoundtripPrice = newTrainData.minPrice;
				newTrainData.totPrice = Math.round((newTrainData.minPrice + outgoingTrain.minPrice)*10)/10;
				companyReturnTrains.push(newTrainData) // train found in return trains req was not found in first req for (one way) coming back trains?
			} else {
				matchingTrain.minRoundtripPrice = newTrainData.minPrice;
				// this is not perfect, ideally the back end would return the oneway price
				if (matchingTrain.minOnewayPrice === undefined) matchingTrain.minOnewayPrice = matchingTrain.minPrice; 
				matchingTrain.minPrice = Math.min(matchingTrain.minOnewayPrice, matchingTrain.minRoundtripPrice);
				let minOutgoingPrice = getMinOutgoingPrice(outgoingTrains);
				if (matchingTrain.minOnewayPrice <= matchingTrain.minRoundtripPrice){ // no AR offers, can also choose outgoing train of other company
					matchingTrain.totPrice = Math.round((minOutgoingPrice + matchingTrain.minPrice)*10)/10;
				} else {
					let minMixedPrice = minOutgoingPrice + matchingTrain.minOnewayPrice;
					let minRoundtripPrice = outgoingTrain.minPrice + matchingTrain.minRoundtripPrice;
					matchingTrain.totPrice = Math.min(minMixedPrice, minRoundtripPrice);
				}
			}
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
		if ((Date.now() - time)/1000 > 300){
			console.log('More than 5 minutes passed since original request, might be too much!')
			return;
		} 
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
				console.log('Results.length > 0, updating prices');
				let chosen = {...state.trains.chosen,  [train.company]: train}
				let newReturningTrains = addRoundtripPrices(reqResults, state.trains.returning, chosen, train.company)
				dispatch({type: 'selectOutgoingTrip', payload: {returning: newReturningTrains, chosen, error: reqResults.error}})
			} else 
				console.log('Results.length <= 0, setting Error to '+reqResults.error);
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
			<tr key={result.id} className={className} onDoubleClick={saveTrain.bind(null, result, false)}> {/* Have to pass it explicitly otherwise the event gets passed and since it's an object it's always truthy */}
			{/* <tr key={result.id} className={className} onDoubleClick={roundtrip ? searchReturn.bind(null, result) : undefined}> */}
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
	
	const dev = false;
	return (
		<div className='tableDiv'>
		<h2>Andata</h2>
		<table className={state.trains?.returning.length ? '' : 'fullWidth'}>
		<thead>
			<tr>
				<th onClick={() => updateSortOrder('departureTime', setSortOrder)} >Partenza</th>
				<th onClick={updateSortOrder.bind(null, 'arrivalTime', setSortOrder)} >Arrivo</th>
				<th onClick={updateSortOrder.bind(null, 'duration', setSortOrder)} >Durata</th>
				<th onClick={updateSortOrder.bind(null, 'minPrice', setSortOrder)} >Prezzo</th>
				<th className='companyCol' onClick={updateSortOrder.bind(null, 'company', setSortOrder)} >Azienda {dev ? <span style={{display: showMore === 'table-cell' ? 'none' : 'inline'}} onDoubleClick={toggleShowMore}>&#8594;</span> : null}</th>
				<th style={{display: showMore}} onClick={updateSortOrder.bind(null, 'minIndividualPrice', setSortOrder)} >Single</th>
				<th style={{display: showMore}} onClick={updateSortOrder.bind(null, 'young', setSortOrder)} >Adult</th>
				<th style={{display: showMore}} onClick={updateSortOrder.bind(null, 'senior', setSortOrder)} >Young</th>
				<th style={{display: showMore}} onClick={updateSortOrder.bind(null, 'adult', setSortOrder)} >Senior<span onClick={toggleShowMore}>&#8592;</span></th>
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
