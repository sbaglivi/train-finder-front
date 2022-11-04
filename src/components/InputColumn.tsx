function getFieldErrorMessage(name: string): string {
    let errorMessage;
    switch (name) {
        case 'origin':
        case 'destination':
            errorMessage = `Station name not valid`;
            break;
        case 'dateTime':
        case 'returnDateTime':
            errorMessage = `Invalid date. Accepted formats are: dd/mm, dd/mm hh, dd/mm/yy hh`;
            break;
        case 'passengers':
            errorMessage = `Invalid number of passengers. Enter three numbers between 0 and 9 respectively for: adults, seniors, youngs. At least 1 value must be different from 0.`;
            break;
        default:
            errorMessage = `Not a valid value for field ${name}`;
    }
    return errorMessage;
}
const fieldErrorMessages = {
    origin: ``,
    destination: ``,
    dateTime: ``,
    returnDateTime: ``,
    passengers: ``,
}
const InputColumn = ({ label, valid, inputName, index, children }: { label?: string, valid: boolean, inputName: string, index: number, children: JSX.Element }) => {
    let id = `${inputName}Input`;
    return (
        <div className={`column col-${index} ${!valid ? "invalid" : ''}`} key={id}>
            {label ? <label htmlFor={id}>{label}</label> : null}
            {children}
            {!valid ? <p>{getFieldErrorMessage(inputName)}</p> : null}
        </div>
    )
}

export default InputColumn;