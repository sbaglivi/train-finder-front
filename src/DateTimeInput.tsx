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
            title="Day, month, (optionally year) and time. E.g. June 1st at 19:00 would be '01/06 19'"
            onBlur={e => validateDateTime(e.target.value, setFormData, goingoutDateTime)}
            onChange={e => setFormData(old => ({ ...old, [name]: [e.target.value] }))}
        />
    )
}

export default DateTimeInput;