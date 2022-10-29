import Fuse from 'fuse.js';
import React, { useState } from 'react';
import { State } from "./App";
import InputColumn from './InputColumn';

const acceptedStations = ['Milano Centrale', 'Milano Garibaldi', 'Reggio Emilia', 'Bologna', 'Firenze', 'Roma Termini', 'Roma Tiburtina', 'Napoli Centrale', 'Napoli Afragola', 'Salerno', 'Vallo della Lucania'];
const fuse = new Fuse(acceptedStations, { includeScore: true });

const StationInput = ({ setFormData, origin, destination, originValid, destinationValid }: { setFormData: React.Dispatch<React.SetStateAction<State["prevQuery"]["formData"]>>, origin: string, destination: string, originValid: boolean, destinationValid: boolean }) => {
    const [ulOffset, setUlOffset] = useState({ left: 0, top: 0 });
    const [searchResults, setSearchResults] = useState<string[]>([]);
    let ulDisplay = searchResults.length > 0 ? 'block' : 'none';

    const updateValueAndSearchResults = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(formData => ({ ...formData, [e.target.name]: e.target.value }));
        setSearchResults(fuse.search(e.target.value).map(result => result.item))
    }

    const acceptSearchResult = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            if (searchResults.length > 0) {
                if (e.key === 'Enter') e.preventDefault();
                let target = e.target as HTMLInputElement;
                setFormData(formData => ({ ...formData, [target.name]: searchResults[0] }))
                setSearchResults([]);
            }
        }
    }

    const acceptSearchResultOnClick = (value: string) => {
        let activeElement = document.activeElement
        if (activeElement instanceof HTMLInputElement) {
            let field = activeElement.name;
            setFormData(old => ({ ...old, [field]: value }));
            setSearchResults([]);
            if (activeElement.name === 'origin') {
                let destinationInput = document.getElementById('destinationInput')
                if (destinationInput) destinationInput.focus()
            } else {
                let dateTimeInput = document.getElementById('dateTimeInput')
                if (dateTimeInput) dateTimeInput.focus()
            }
        }
    }

    const showSearchResults = (e: React.ChangeEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
        setSearchResults(fuse.search(e.target.value).map(result => result.item))
        const leftOffset = e.target.offsetLeft
        const topOffset = e.target.offsetTop + e.target.offsetHeight;
        setUlOffset({ left: leftOffset, top: topOffset });
    }

    return (
        <>
            <ul style={{ display: ulDisplay, left: `${ulOffset.left}px`, top: `${ulOffset.top}px` }}>
                {searchResults.map((result, index) =>
                    <li key={index} onClick={acceptSearchResultOnClick.bind(null, result)} onMouseDown={(e) => e.preventDefault()}>{result}</li>
                )}
            </ul>
            <InputColumn label="Partenza:" valid={originValid} index={1} inputName={"origin"}>
                <input
                    id={`originInput`}
                    autoComplete='off'
                    type='text'
                    placeholder={"Milano"}
                    name={"origin"}
                    value={origin}
                    onChange={updateValueAndSearchResults}
                    onKeyDown={acceptSearchResult}
                    onBlur={() => setSearchResults([])}
                    onFocus={showSearchResults}
                />
            </InputColumn>
            <InputColumn label="Destinazione:" valid={destinationValid} index={2} inputName={"destination"}>
                <input
                    id={`destinationInput`}
                    autoComplete='off'
                    type='text'
                    placeholder={"Roma"}
                    name={"destination"}
                    value={destination}
                    onChange={updateValueAndSearchResults}
                    onKeyDown={acceptSearchResult}
                    onBlur={() => setSearchResults([])}
                    onFocus={showSearchResults}
                />
            </InputColumn>
        </>
    )
}

export default StationInput;