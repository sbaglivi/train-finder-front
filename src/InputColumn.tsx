import React from "react";

/*
Necessary props:
- Label
- valid
- Placeholder
- name
- id  ? Maybe this can be computed by appending Input to name or something similar
- onChange
- value

Depending on input:
- onBlur
- onKeyDown
- onFocus



*/

const InputColumn = ({ label, valid, inputName, index, children }: { label?: string, valid: boolean, inputName: string, index: number, children: JSX.Element }) => {
    let id = `${inputName}Input`;
    return (
        <div className={`column col-${index}`} key={id}>
            {label ? <label htmlFor={id}>{label}</label> : null}
            {children}
            {!valid ? <p style={{ color: "red" }}>Field not valid</p> : null}
        </div>
    )
}

export default InputColumn;