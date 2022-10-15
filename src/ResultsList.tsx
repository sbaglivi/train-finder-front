import {useState, useEffect} from 'react';
import {post as postWithoutDispatch, stationNameToCamelcase, departureTimeSort, updateSortOrder, applySortOrder, binarySearch} from './utilityFunctions'
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

	const reorderResults = (newOrder: Train[]) => {
		dispatch({type: 'reorderResults', payload: {direction: 'outgoing', newOrder}});
	}

	useEffect(() => {
		applySortOrder(sortOrder, results, reorderResults);
		console.log(sortOrder)
	}, [sortOrder]) // is this wrong?

	function getMinPriceIfExists(train:Train){
		if  (typeof train.minPrice === 'number'){
			if (typeof train.returnMinPrice === 'number') return Math.min(train.returnMinPrice, train.minPrice);
			else return train.minPrice
		}
		return false;
	}

	function addRoundtripPrices(reqResults: { results: Train[]}, returningTrains:Train[], outgoingTrain:Train){
		const company = outgoingTrain.company;
		reqResults.results.sort((a,b) => departureTimeSort(a,b,1)); // if I sort one list I should also sort the other, othewise what's the point? also I should remove from the list trains thta have been matched
		let companyReturnTrains = state.trains.returning.filter(train => train.company === company).sort((a,b) => departureTimeSort(a,b,1));
		for (let newTrainData of reqResults.results){
			// for some hellish reason if I defined the result of binarySearch as Type | Boolean (or Type | false) it would not work
			// Hellish reason is probably that Boolean is a keyword for something else and boolean is the normal type. fml
			let matchingTrain: Train | false = binarySearch(companyReturnTrains, newTrainData, departureTimeSort);

			if (!matchingTrain){
				console.log(matchingTrain);
				console.log(newTrainData)
				newTrainData.returnMinPrice = newTrainData.minPrice;
				const outgoingMinPrice = state.trains.chosen[newTrainData.company]?.minPrice;
				const minReturnPrice = getMinPriceIfExists(newTrainData)
				if (minReturnPrice && typeof outgoingMinPrice === 'number'){
					newTrainData.totPrice = Math.round((minReturnPrice + outgoingMinPrice)*10)/10;
				} else {
					newTrainData.totPrice = '/'
				}
				companyReturnTrains.push(newTrainData) // train found in return trains req was not found in first req for (one way) coming back trains?
			} else {
				matchingTrain.returnMinPrice = newTrainData.minPrice;
				const outgoingMinPrice = outgoingTrain.minPrice;
				const minReturnPrice = getMinPriceIfExists(matchingTrain)
				if (minReturnPrice && typeof outgoingMinPrice === 'number'){ 
					//totalPrice = minReturnPrice + outgoingTrains[result.company].minPrice;
					matchingTrain.totPrice = Math.round((minReturnPrice + outgoingMinPrice)*10)/10;
					// totalPrice = Math.round((minReturnPrice + (outgoingTrains[result.company]!.minPrice as number))*10)/10;
				} else {
					matchingTrain.totPrice = '/'
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
				console.log('Results.length > 0, updating prices');
				let newReturningTrains = addRoundtripPrices(reqResults, state.trains.returning, train)
				let chosen = {...state.trains.chosen,  [train.company]: train}
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
				<th onClick={() => updateSortOrder('departureTime', setSortOrder)} >Partenza</th>
				<th onClick={updateSortOrder.bind(null, 'arrivalTime', setSortOrder)} >Arrivo</th>
				<th onClick={updateSortOrder.bind(null, 'duration', setSortOrder)} >Durata</th>
				<th onClick={updateSortOrder.bind(null, 'minPrice', setSortOrder)} >Prezzo</th>
				<th className='companyCol' onClick={updateSortOrder.bind(null, 'company', setSortOrder)} >Azienda <span style={{display: showMore === 'table-cell' ? 'none' : 'inline'}} onDoubleClick={toggleShowMore}>&#8594;</span></th>
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
