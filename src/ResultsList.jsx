import {useState} from 'react';
import departureTimeSort from './departureTimeSort.js';

const ResultsList = ({results, reorderResults, roundtrip, style, setReturnResults}) => {
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

	const searchReturn = async (id, company) => {
		const {query: {origin, destination, dateTime, returnDateTime, passengers, time}, trenitaliaCartId, trenitaliaCookies, italoCookies} = results;
		if ((Date.now() - time)/1000 > 300) {
			console.log('More than 5 minutes passed since original request, might be too much!')
			return;
		}
		console.log(results.results.filter(result => result.id === id)[0])
		if (company === 'trenitalia'){
			let requestBody = {origin, destination, dateTime, returnDateTime, passengers, goingoutId: id, cartId: trenitaliaCartId, cookies: trenitaliaCookies, company}
			let response = await fetch('/aerr', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(requestBody)
			})
			if (!response.ok){
				console.log('Response was not ok while submitting');
				return
			}
			let content = await response.json();
			setReturnResults(oldRes => updateResults(oldRes, content, company));
			console.log(content)
		} else if (company === 'italo'){
			console.log('time passed since going out query: '+(Date.now() - time)/1000)
			console.log(origin, destination, dateTime, returnDateTime, passengers)
			if ((Date.now() - time)/1000 > 180) console.log('More than 3 minutes passed since original request, might be too much!')
			let requestBody = {origin, destination, dateTime, returnDateTime, passengers, goingoutId: id, company, cookies: italoCookies}
			let response = await fetch('/aerr', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(requestBody)
			})
			if (!response.ok){
				console.log('Response was not ok while submitting');
				return
			}
			let content = await response.json();
			setReturnResults(oldRes => updateResults(oldRes, content, company));
			console.log(content)
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
				{results.results.map(result => 
					<tr key={result.id}>
						<td>{result.departureTime}</td>
						<td>{result.arrivalTime}</td>
						<td>{result.duration}</td>
						<td>{result.minPrice}</td>
						<td>{result.company}</td>
						<td><button onClick={searchReturn.bind(null, result.company === 'trenitalia' ? result.id : result.inputValue, result.company)}>Search return</button></td>
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
