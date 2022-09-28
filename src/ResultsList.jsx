import {useState} from 'react';
import departureTimeSort from './departureTimeSort.js';
import {post, stationNameToCamelcase} from './formSubmit'

const ResultsList = ({results, reorderResults, style, prevQuery, setTrains, setError, returnTrains}) => {
	let [sortOrder, setSortOrder] = useState({by: 'departureTime', asc: 1});
	let [showMore, setShowMore] = useState('none')
	let [selected, setSelected] = useState({italo: '', trenitalia: ''})

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
				reorderResults('outgoing', newOrder.sort((a,b) => departureTimeSort(a,b,sortOrder.asc)));
				break;
			default:
				return;
		}
	}

	const searchReturn = async (train) => {
		const {formData: {origin, destination, dateTime, returnDateTime, passengers}, time, return: { italo: { cookies: italoCookies }, trenitalia: {cookies: trenitaliaCookies, cartId}}} = prevQuery;
		if ((Date.now() - time)/1000 > 300) {
			console.log('More than 5 minutes passed since original request, might be too much!')
			// return;
		}
		console.log('cartId is: '+cartId)
		console.log(train)
		let requestBody = {origin: stationNameToCamelcase(origin), destination: stationNameToCamelcase(destination), dateTime, returnDateTime, passengers, company: train.company}
		let reqResults;
		if (train.company === 'trenitalia'){
			try {
				requestBody = {...requestBody, goingoutId: train.id, cartId, cookies: trenitaliaCookies}
				console.log(trenitaliaCookies);
				reqResults = await post('/return', JSON.stringify(requestBody))
				if (reqResults.error) setError(reqResults.error)
				else setError('')
				if (reqResults.results.length){
					// Are they from the same query?
					// sort them, then iterate on one and iterate over other to try and 
					// find a match, if you do you set the returnminprice, if you don't you just add it as a new result
					reqResults.results.sort((a,b) => departureTimeSort(a,b,1));
					let trenitaliaReturnTrains = returnTrains.filter(train => train.company === 'trenitalia')
					for (let newTrainData of reqResults.results){
						let matchFound = false;
						for (let trainData of trenitaliaReturnTrains){
							if (newTrainData.departureTime === trainData.departureTime && newTrainData.arrivalTime === trainData.arrivalTime){
								trainData.returnMinPrice = newTrainData.minPrice;
								matchFound = true;
								break;
							}
						}
						if (!matchFound) trenitaliaReturnTrains.push(newTrainData)
					}
					setTrains(old => ({...old, returning: [...old.returning.filter(train => train.company !== 'trenitalia'), ...trenitaliaReturnTrains].sort((a,b) => departureTimeSort(a,b,1)), chosen: {...old.chosen, [train.company]: train}}))
					setSelected(prev => ({...prev, [train.company]: train.id}))
					console.log(reqResults)
				}
			} catch {
				console.log('request for trenitalia returns failed')
				console.log('python3 splitA.py '+[requestBody.origin, requestBody.destination, ...requestBody.dateTime.replaceAll('/','-').split(' '), requestBody.passengers, ...requestBody.returnDateTime.replaceAll('/','-').split(' ')].join(' '))
			}
			// update query?
		} else if (train.company === 'italo'){
			try {
				requestBody = {...requestBody, inputValue: train.inputValue, cookies: italoCookies}
				reqResults = await post('/return', JSON.stringify(requestBody))
				if (reqResults.error) setError(reqResults.error)
				else setError('')
				if (reqResults.results.length){
					reqResults.results.sort((a,b) => departureTimeSort(a,b,1));
					let italoReturnTrains = returnTrains.filter(train => train.company === 'italo')
					for (let newTrainData of reqResults.results){
						let matchFound = false;
						for (let trainData of italoReturnTrains){
							if (newTrainData.departureTime === trainData.departureTime && newTrainData.arrivalTime === trainData.arrivalTime){
								trainData.returnMinPrice = newTrainData.minPrice;
								matchFound = true;
								break;
							}
						}
						if (!matchFound) italoReturnTrains.push(newTrainData)
					}
					setTrains(old => ({...old, returning: [...old.returning.filter(train => train.company !== 'italo'), ...italoReturnTrains].sort((a,b) => departureTimeSort(a,b,1)), chosen: {...old.chosen, [train.company]: train}}))
					setSelected(prev => ({...prev, [train.company]: train.id}))
					console.log(reqResults)
				}
			} catch {
				console.log('request for italo returns failed')
			}
			// updateQuery?
		}
	}

	let tableRows = results.map(result => {
		let backgroundColor = selected[result.company] === result.id ? (result.company === 'italo' ? 'blue' : 'green') : 'black'
		return (
			<tr key={result.id} style={{backgroundColor: backgroundColor}} >
				<td>{result.departureTime}</td>
				<td>{result.arrivalTime}</td>
				<td>{result.duration}</td>
				<td>{result.minPrice}</td>
				<td>{result.company}</td>
				<td><button onClick={searchReturn.bind(null, result)}>Search return</button></td>
				<td style={{display: showMore}} >{result.minIndividualPrice}</td>
				<td style={{display: showMore}} >{result.young}</td>
				<td style={{display: showMore}} >{result.senior}</td>
				<td style={{display: showMore}} >{result.adult}</td>
			</tr>
		)
	})
	

	return (
		<table style={style}>
		<thead>
			<tr>
				<th onClick={() => sortResults('departureTime')} >Departure</th>
				<th>Arrival</th>
				<th>Duration</th>
				<th>Prezzo Minimo</th>
				<th>Company <span style={{display: showMore === 'table-cell' ? 'none' : 'inline'}} onClick={toggleShowMore}>&#8594;</span></th>
				<th>Return</th>
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
	)
}

export default ResultsList;
