import {useState} from 'react';
import departureTimeSort from './departureTimeSort.js';
const ReturnResultsTable = ({reorderResults, results, outgoingTrains, style}) => {
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
				reorderResults('returning', newOrder.sort((a,b) => departureTimeSort(a,b,sortOrder.asc)));
				break;
			default:
				return;
		}
	}

	let tableRows = results.map(result => {
		let backgroundColor = result.company === 'italo' ? 'blue' : 'green'
		return (
			<tr key={result.id} style={{backgroundColor: backgroundColor}} >
				<td>{result.departureTime}</td>
				<td>{result.arrivalTime}</td>
				<td>{result.duration}</td>
				<td>{result.minPrice}</td>
				<td>{result.returnMinPrice}</td>
				<td>{result.company}</td>
				<td>{outgoingTrains[result.company]?.minPrice ? Math.round(10*(result.minPrice + outgoingTrains[result.company].minPrice))/10 : '/'}</td>
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
					<th>Con andata</th>
					<th>Company <span style={{display: showMore === 'table-cell' ? 'none' : 'inline'}} onClick={toggleShowMore}>&#8594;</span></th>
					<th >Total Price</th>
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

export default ReturnResultsTable;

// Each table will have headers and rows, most of the rows content
// will be the same and both will have sorting functionality.
// One of the two needs to be able to expand with an additional
// column for the return search and the relative functionality
// The other should have an additional price field (or more)
// to account for the price independent on outgoing trip
//
//
//
