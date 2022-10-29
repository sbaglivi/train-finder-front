import React, { useState } from 'react';
import { validateData, acceptedStations } from './utilityFunctions';
import { State } from './App'
import InputColumn from "./InputColumn";
import StationInputs from "./StationInputs";
import DateTimeInput from './DateTimeInput';


const SearchForm = ({ onFormSearch }: { onFormSearch: (formData: State["prevQuery"]["formData"]) => void }) => {
	const [formData, setFormData] = useState({ origin: '', destination: '', dateTime: '', returnDateTime: '', passengers: '100' });
	const [validFields, setValidFields] = useState({ origin: true, destination: true, dateTime: true, returnDateTime: true, passengers: true });

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!validateData(formData, setFormData, acceptedStations, setValidFields)) {
			return;
		}
		onFormSearch(formData);
	}

	return (
		<form onSubmit={onSubmit}>
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
						id="passengersInput" name="passengers" value={formData.passengers} onChange={e => setFormData({ ...formData, passengers: e.target.value })} onFocus={(e) => e.target.select()}
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
