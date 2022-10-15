import {useState, useEffect} from 'react';
import {updateSortOrder, applySortOrder} from './utilityFunctions';
import {Train, State} from './App';

const ReturnResultsTable = ({reorderResults, results, outgoingTrains}: {reorderResults: (newOrder: Train[]) => void, results: Train[], outgoingTrains: State['trains']['chosen']}) => {
	let [sortOrder, setSortOrder] = useState({by: 'departureTime', asc: 1});
	let [showMore, setShowMore] = useState('none')

	const toggleShowMore = () => {
		setShowMore(oldVal => oldVal === 'none' ? 'table-cell' : 'none')
	}

	useEffect(() => {
		applySortOrder(sortOrder, results, reorderResults);
		console.log(sortOrder);
	}, [sortOrder])

	let anyOutgoingTrainSelected = outgoingTrains.italo || outgoingTrains.trenitalia;
	let tableRows = results.map(result => {
		return (
			<tr key={result.id} >
				<td>{result.departureTime}</td>
				<td>{result.arrivalTime}</td>
				<td>{result.duration}</td>
				<td>{result.minPrice}</td>
				{anyOutgoingTrainSelected ? <td>{result.returnMinPrice}</td> : null}
				{anyOutgoingTrainSelected ? <td>{result.totPrice}</td> : null}
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
		<h2>Ritorno</h2>
		<table >
			<thead>
				<tr>
					<th onClick={updateSortOrder.bind(null, 'departureTime', setSortOrder)} >Partenza</th>
					<th onClick={updateSortOrder.bind(null, 'arrivalTime', setSortOrder)} >Arrivo</th>
					<th onClick={updateSortOrder.bind(null, 'duration', setSortOrder)} >Durata</th>
					<th onClick={updateSortOrder.bind(null, 'minPrice', setSortOrder)} >Prezzo</th>
					{anyOutgoingTrainSelected ? <th onClick={updateSortOrder.bind(null, 'returnMinPrice', setSortOrder)}>Off.AR</th> : null}
					{anyOutgoingTrainSelected ? <th onClick={updateSortOrder.bind(null, 'totPrice', setSortOrder)}>Tot</th> : null}
					<th className='companyCol' onClick={updateSortOrder.bind(null, 'company', setSortOrder)} >Azienda <span style={{display: showMore === 'table-cell' ? 'none' : 'inline'}} onDoubleClick={toggleShowMore}>&#8594;</span></th>
					<th style={{display: showMore}} >Single</th>
					<th style={{display: showMore}} >Adult</th>
					<th style={{display: showMore}} >Young</th>
					<th style={{display: showMore}} >Senior<span onClick={toggleShowMore}>&#8592;</span></th>
				</tr>
			</thead>
			<tbody>
				{tableRows}
			</tbody>
		</table>
		</div>
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
