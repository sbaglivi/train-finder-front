import React from "react";
import { validateDateTime } from "./utilityFunctions";
import { State } from "./App";

const DateTimeInput = ({ name, value, setFormData, goingoutDateTime = '' }: { name: string, value: string, setFormData: React.Dispatch<React.SetStateAction<State["prevQuery"]["formData"]>>, goingoutDateTime?: string }) => {
    return (
        <input
            id={`${name}Input`}
            type='text'
            autoComplete='off'
            placeholder='dd/mm hh'
            name={name}
            value={value}
            onBlur={e => validateDateTime(e.target.value, setFormData, goingoutDateTime)}
            onChange={e => setFormData(old => ({ ...old, [name]: [e.target.value] }))}
        />
    )
}

export default DateTimeInput;