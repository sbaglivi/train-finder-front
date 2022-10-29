import React, { useState } from 'react';
import { validateData, validateDateTime, getDifferentFields, stationNameToCamelcase, post as postWithoutDispatch, departureTimeSort } from './utilityFunctions';
import { State, Action, Train } from './App'
import InputColumn from "./InputColumn";
import StationInputs from "./StationInputs";
import DateTimeInput from './DateTimeInput';

const acceptedStations = ['Milano Centrale', 'Milano Garibaldi', 'Reggio Emilia', 'Bologna', 'Firenze', 'Roma Termini', 'Roma Tiburtina', 'Napoli Centrale', 'Napoli Afragola', 'Salerno', 'Vallo della Lucania'];

const SearchForm = ({ previousFormData, dispatch }: { previousFormData: State['prevQuery']['formData'], dispatch: (action: Action) => void }) => {
	const [formData, setFormData] = useState({ origin: '', destination: '', dateTime: '', returnDateTime: '', passengers: '100' });
	const [validFields, setValidFields] = useState({ origin: true, destination: true, dateTime: true, returnDateTime: true, passengers: true });

	const post = async (path: string, body: BodyInit, returning: boolean = false) => {
		return await postWithoutDispatch(path, body, returning, dispatch);
	}

	const updateFormData = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
		const name = e.target.name
		setFormData(formData => ({ ...formData, [name]: e.target.value }))
	}

	const getResults = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!validateData(formData, setFormData, acceptedStations, setValidFields)) {
			return;
		}

		let oneWay = !formData.returnDateTime;
		let differentFields: string[] | [] = getDifferentFields(previousFormData, formData)
		if (differentFields.length === 0)
			return;
		let currentTimestamp = Date.now()
		let query = { formData, time: currentTimestamp }
		let origin = stationNameToCamelcase(formData.origin)
		let destination = stationNameToCamelcase(formData.destination)
		let results

		if (oneWay) {
			console.log('making search')
			let reqBody = { ...formData, origin, destination }
			results = await post('/outgoingOnly', JSON.stringify(reqBody)) // File to run is the simple one that just return lines
			if (!results) return;
			results.results.sort((a: Train, b: Train) => departureTimeSort(a, b, 1));
			dispatch({ type: 'onewaySearch', payload: { query, outgoing: results.results, error: results.error } })

		} else {
			if (differentFields.length === 1 && differentFields[0] === 'returnDateTime') {
				// should check if already chosen selected
				let body = { ...formData, origin: destination, destination: origin } // swapped them because I'm looking for return trips, no?
				results = await post('/outgoingOnly', JSON.stringify(body), true) // simple script no metadata since only return search
				if (!results) return;
				results.results.sort((a: Train, b: Train) => departureTimeSort(a, b, 1));
				dispatch({ type: 'returnTimeUpdate', payload: { query, error: results.error, returning: results.results } });
			} else {
				let body = { ...formData, origin, destination }
				results = await post('/allNoOffers', JSON.stringify(body)) // this needs to return metadata
				if (!results) return;
				results.results.outgoing.sort((a: Train, b: Train) => departureTimeSort(a, b, 1));
				results.results.returning.sort((a: Train, b: Train) => departureTimeSort(a, b, 1));
				dispatch({ type: 'roundtripSearch', payload: { query, error: results.error, outgoing: results.results.outgoing, returning: results.results.returning, metadata: results.metadata } })
			}
		}
	}

	return (
		<form onSubmit={getResults}>
			<StationInputs setFormData={setFormData} origin={formData.origin} originValid={validFields.origin} destinationValid={validFields.destination} destination={formData.destination} />
			<InputColumn label="Data/ora partenza:" valid={validFields.dateTime} inputName="dateTime" index={3}>
				<DateTimeInput name="dateTime" value={formData.dateTime} setFormData={setFormData} />
			</InputColumn>
			<InputColumn label="Ritorno (opzionale):" valid={validFields.returnDateTime} inputName="returnDateTime" index={4}>
				<DateTimeInput name="returnDateTime" value={formData.returnDateTime} setFormData={setFormData} goingoutDateTime={formData.dateTime} />
			</InputColumn>
			<InputColumn valid={validFields.passengers} inputName="passengers" index={5}>
				<div className='passengersDiv'>
					<textarea cols={1} rows={3} maxLength={3} minLength={3} className={validFields.passengers ? "" : "invalid"}
						title={"3 numbers from 0 to 9 that describe respectively the number of adult, senior and young passengers. (At least one needs to be different from 0)"}
						id="passengersInput" name="passengers" value={formData.passengers} onChange={updateFormData} onFocus={(e) => e.target.select()}
						required
					></textarea>
					<label htmlFor='passengersInput' className='passengersLabel'>Adulti Senior Giovani</label>
				</div>
			</InputColumn>
			<button className='formSearchButton'>Search</button>
		</form>
	);
}

export default SearchForm;
