import { useState, useEffect } from 'react';
import { updateSortOrder, applySortOrder } from '../utilityFunctions';
import { Train, State } from '../types';

const ReturnResultsTable = ({ reorderResults, results, outgoingTrains, saveTrain }: { reorderResults: (newOrder: Train[]) => void, results: Train[], outgoingTrains: State['trains']['chosen'], saveTrain: (train: Train, invert: boolean) => void }) => {
	let [sortOrder, setSortOrder] = useState({ by: 'departureTime', asc: 1 });
	let [showMore, setShowMore] = useState('none')

	const toggleShowMore = () => {
		setShowMore(oldVal => oldVal === 'none' ? 'table-cell' : 'none')
	}

	useEffect(() => {
		// applySortOrder(sortOrder, results, reorderResults);
		console.log(sortOrder);
	}, [sortOrder])

	let anyOutgoingTrainSelected = outgoingTrains.italo || outgoingTrains.trenitalia;
	let hintNeeded = false;
	let tableRows = results.map(result => {
		let minPriceRequiresRoundtrip = result.minOnewayPrice && result.minPrice !== result.minOnewayPrice;
		let minPriceTd;
		if (minPriceRequiresRoundtrip) {
			if (!hintNeeded) hintNeeded = true;
			minPriceTd = <td className={'roundtripOnly'}><span>{`Prezzo disponibile solo se compri l'andata con ${result.company}`}</span>{result.minPrice}*</td>
		} else {
			minPriceTd = <td>{result.minPrice}</td>
		}
		return (
			<tr key={result.id} onDoubleClick={saveTrain.bind(null, result, true)}>
				<td>{result.departureTime}</td>
				<td>{result.arrivalTime}</td>
				<td>{result.duration}</td>
				{minPriceTd}
				{anyOutgoingTrainSelected ? <td>{result.totPrice}</td> : null}
				<td className='companyCol'>{result.company}</td>
				{anyOutgoingTrainSelected ? <td style={{ display: showMore }}>{result.minRoundtripPrice}</td> : null}
				<td style={{ display: showMore }} >{result.minIndividualPrice}</td>
				<td style={{ display: showMore }} >{result.adult}</td>
				<td style={{ display: showMore }} >{result.young}</td>
				<td style={{ display: showMore }} >{result.senior}</td>
			</tr>
		)
	})
	const dev = false;
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
						{anyOutgoingTrainSelected ? <th onClick={updateSortOrder.bind(null, 'totPrice', setSortOrder)}>Tot</th> : null}
						<th className='companyCol' onClick={updateSortOrder.bind(null, 'company', setSortOrder)} >Azienda {dev ? <span style={{ display: showMore === 'table-cell' ? 'none' : 'inline' }} onDoubleClick={toggleShowMore}>&#8594;</span> : null}</th>
						{anyOutgoingTrainSelected ? <th style={{ display: showMore }} onClick={updateSortOrder.bind(null, 'minRoundtripPrice', setSortOrder)}>Off.AR</th> : null}
						<th style={{ display: showMore }} >Single</th>
						<th style={{ display: showMore }} >Adult</th>
						<th style={{ display: showMore }} >Young</th>
						<th style={{ display: showMore }} >Senior<span onClick={toggleShowMore}>&#8592;</span></th>
					</tr>
				</thead>
				<tbody>
					{tableRows}
				</tbody>
			</table>
			{hintNeeded ? <p className='mobileHint'>* Prezzo disponibile solo se compri l'andata con la stessa compagnia.</p> : null}
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
