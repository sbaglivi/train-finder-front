const parse = require('date-fns/parse')
const format = require('date-fns/format')
const formatISO = require('date-fns/formatISO')
// import parse from 'date-fns/parse';
// import format from 'date-fns/format';
const referenceDate = new Date();
console.log(formatISO(referenceDate));
referenceDate.setHours(referenceDate.getHours()+1, 0, 0, 0);

function validateDateTime(str){
	const possibleDateTimeFormats = ["dd/MM/yy HH", "dd/MM/yy"]
	let errorText = ''
	for (let possibleFormat of possibleDateTimeFormats){
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

// len 5 -> I want el (01)2(34) len 4 -> I want el 1 or 2, either works 
let arr = [
	{a: 5, b:6},
	{a: 3, b:4},
	{a: 2, b:3},
	{a: 1, b:2},
	{a: 9, b:10},
]

function compare(a,b){
	if (a.a > b.a) return 1;
	else if (a.a < b.a) return -1;
	else return 0;
}

console.log(arr);
arr.sort(compare);
console.log(arr);


// 1 -> put a after b (a > b), -1 -> put b after a (b > a), 0 => maintain order (equal)
function binarySearch(array, element, compareFn){
	let halfPoint = Math.round((array.length-1)/2);
	let comparisonResult = compareFn(array[halfPoint], element);
	console.log(array, comparisonResult)
	if (array.length === 1) return ( (compareFn(array[0], element) === 0) ? array[0] : false);

	if (comparisonResult === 1){ // this takes the lower value if length is even, on 4 elements it takes 1 etc
		return binarySearch(array.slice(0, halfPoint), element, compareFn)
	} else if (comparisonResult === -1 ) {
		return binarySearch(array.slice(halfPoint, array.length), element, compareFn);
	} else {
		return array[halfPoint];
	}
}

let searchRes = binarySearch(arr, {a: 8, c:7}, compare);
console.log(searchRes);
searchRes = binarySearch(arr, {a: 2, c:7}, compare);
console.log(searchRes);