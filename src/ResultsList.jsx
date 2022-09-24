import {useState} from 'react';
import departureTimeSort from './departureTimeSort.js';
import {post, stationNameToCamelcase} from './formSubmit'

const ResultsList = ({results, reorderResults, roundtrip, style, prevQuery, setTrains}) => {
	let [sortOrder, setSortOrder] = useState({by: 'departureTime', asc: 1});
	let [showMore, setShowMore] = useState('none')

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
				reorderResults(newOrder.sort((a,b) => departureTimeSort(a,b,sortOrder.asc)));
				break;
			default:
				return;
		}
	}

	const updateResults = (oldRes, newRes, company) => {
		let allResults = oldRes.results
		let otherCompanyResults = allResults.filter(result => result.company !== company)
		allResults = [...otherCompanyResults, ...newRes].sort((a, b) => departureTimeSort(a, b, 1))
		return { ...oldRes, results: allResults }
	}

	const searchReturn = async (id, company, inputValue) => {
		const {formData: {origin, destination, dateTime, returnDateTime, passengers}, time, return: { italo: { cookies: italoCookies }, trenitalia: {cookies: trenitaliaCookies, cartId}}} = prevQuery;
		if ((Date.now() - time)/1000 > 300) {
			console.log('More than 5 minutes passed since original request, might be too much!')
			// return;
		}
		console.log(results.filter(result => result.id === id)[0])
		let requestBody = {origin: stationNameToCamelcase(origin), destination: stationNameToCamelcase(destination), dateTime, returnDateTime, passengers, company}
		let reqResults;
		if (company === 'trenitalia'){
			requestBody = {...requestBody, goingoutId: id, cartId, cookies: trenitaliaCookies}
			reqResults = await post('/return', JSON.stringify(requestBody))
			if (reqResults.length){
				setTrains(old => ({...old, returning: [...old.returning.filter(train => train.company !== 'trenitalia'), ...reqResults]}))
				console.log(reqResults)
			} else {
				console.log('request for italo returns failed')
			}
			// update query?
		} else if (company === 'italo'){
			requestBody = {...requestBody, inputValue, cookies: italoCookies}
			reqResults = await post('/return', JSON.stringify(requestBody))
			if (reqResults.length){
				setTrains(old => ({...old, returning: [...old.returning.filter(train => train.company !== 'italo'), ...reqResults]}))
				console.log(reqResults)
			} else {
				console.log('request for italo returns failed')
			}
			// updateQuery?
		}
	}
	return (
		<table style={style}>
		<thead>
			<tr>
				<th onClick={() => sortResults('departureTime')} >Departure</th>
				<th>Arrival</th>
				<th>Duration</th>
				<th>Prezzo Minimo</th>
				<th>Company <span style={{display: showMore === 'table-cell' ? 'none' : 'inline'}} onClick={toggleShowMore}>&#8594;</span></th>
				<th style={{dipslay: roundtrip ? 'table-cell' : 'none'}}>Return</th>
				<th style={{display: showMore}}>Single</th>
				<th style={{display: showMore}}>Adult</th>
				<th style={{display: showMore}}>Young</th>
				<th style={{display: showMore}}>Senior<span onClick={toggleShowMore}>&#8592;</span></th>
			</tr>
		</thead>
			<tbody>
				{results.map(result => 
					<tr key={result.id}>
						<td>{result.departureTime}</td>
						<td>{result.arrivalTime}</td>
						<td>{result.duration}</td>
						<td>{result.minPrice}</td>
						<td>{result.company}</td>
						<td style={{dipslay: roundtrip ? 'table-cell' : 'none'}} ><button onClick={searchReturn.bind(null, result.id, result.company, result.inputValue)}>Search return</button></td>
						<td style={{display: showMore}} >{result.minIndividualPrice}</td>
						<td style={{display: showMore}} >{result.young}</td>
						<td style={{display: showMore}} >{result.senior}</td>
						<td style={{display: showMore}} >{result.adult}</td>
					</tr>	
				)}
			</tbody>
		</table>
	)
}

export default ResultsList;
