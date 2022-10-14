const parse = require('date-fns/parse')
const format = require('date-fns/format')
const formatISO = require('date-fns/formatISO')
// import parse from 'date-fns/parse';
// import format from 'date-fns/format';
const referenceDate = new Date();
console.log(formatISO(referenceDate));
referenceDate.setHours(referenceDate.getHours()+1, 0, 0, 0);
const onBlur = event => {
	const possibleDateTimeFormats = ["dd/MM/yy HH", "dd/MM/yy H", "dd/MM/yyy"]
	const dateTimeFormat = "dd/MM/yy HH";
	try {
		console.log(event.target.value)
		let parsedDate = parse(event.target.value, dateTimeFormat, referenceDate)
		if (parsedDate < referenceDate) throw Error("Parsed date is before current date and time") 
		if (isNaN(parsedDate)) throw Error("Invalid date");
	} catch (err) {
		console.log(err);
		console.log(`Error while parsing date: ${event.target.value}.`);
		setFormData(formData => ({...formData, dateTime: ''}));
		return;
	}
} 



function validateDateTime(str){
	const possibleDateTimeFormats = ["dd/MM/yy HH", "dd/MM/yy"]
	let errorText = ''
	for (possibleFormat of possibleDateTimeFormats){
		try {
			let parsedDate = parse(str, possibleFormat, referenceDate)
			if (parsedDate < referenceDate) throw Error("Parsed date is before current date and time") 
			if (isNaN(parsedDate)) throw Error("Invalid date");
			if (possibleFormat == 'dd/MM/yy') parsedDate.setHours('08');
			return format(parsedDate, 'dd/MM/yy HH')
		} catch (err) {
			errorText += `Error: ${err.message} while parsing date: ${str} with format ${possibleFormat}\n`;
		}
	}
	console.log(errorText)
}



console.log(validateDateTime('20/10/22'))

/*
 * On attempts with a single digit for the hours e.g. 2 both H and HH interpret 
 * the content correctly. The same happens if it's a 0 padded digit, like 02, 
 * or simply a 2 digit hour like 19. This makes it look like having both is 
 * redundandt. 
 *
 *
 */
