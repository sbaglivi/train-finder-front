import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'
import {useState} from 'react';
import parse from 'date-fns/parse';
import format from 'date-fns/format';


function App() {
	const [formData, setFormData] = useState({origin: '', destination: '', dateTime: '', passenger: 'all'});
	const dateTimeFormat = "dd/MM/yy HH";
	const onSubmit = async e => {
		e.preventDefault();
		if (Object.keys(formData).some(k => !formData[k])){
			console.log(formData);
			console.log('At least one of the form fields is falsy, check the object above for more info');
			return;
		}
		let {dateTime} = formData;
		let formattedDateTime = `${String(dateTime.getDate()).padStart(2,'0')}-${String(dateTime.getMonth()+1).padStart(2,'0')}-${String(dateTime.getFullYear()).slice(-2)} ${dateTime.getHours().toString().padStart(2,'0')}`;
		console.log({...formData, dateTime: formattedDateTime});
		let response = await fetch('/run', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: JSON.stringify({...formData, dateTime: formattedDateTime})
		})
		if (!response.ok){
			console.log('Response was not ok while submitting');
			return
		}
		let content = await response.json();
		console.log(content)
	}
	const onChange = e => {
		const name = e.target.name
		setFormData(formData => ({...formData, [name]: e.target.value}))
	}
	const referenceDate = new Date();
	referenceDate.setHours(referenceDate.getHours()+1, 0, 0, 0);
	const onBlur = event => {
		try {
			console.log(referenceDate)
			let parsedDate = parse(event.target.value, dateTimeFormat, referenceDate)
			if (parsedDate < referenceDate) throw Error("Parsed date is before current date and time") 
			if (isNaN(parsedDate)) throw Error("Invalid date");
			console.log(parsedDate);
		} catch (err) {
			console.log(err);
			console.log('Could not parse data from datepicker, error above');
			setFormData(formData => ({...formData, dateTime: ''}));
			//event.target.value = '';
			console.log(event.target)
			return;
		}
	}
  return (
    <div className="App">
	  <form action='/run' method='POST' onSubmit={onSubmit}>
	  	<input type='text' placeholder='Origin' name='origin' value={formData.origin} onChange={onChange}/>
	  	<input type='text' placeholder='Destination' name='destination' value={formData.destination} onChange={onChange} />
	  	<DatePicker dateFormat={dateTimeFormat} minDate={new Date()} value={formData.dateTime ? formData.dateTime : format(new Date(), dateTimeFormat)}
	  //onChange={date => setFormData(formData => ({...formData, dateTime: format(date, dateTimeFormat)}))}
	  onChange={(date,e) => {
		  if (!e){ // time panel was clicked, because of lib bug it returns current date with time rather than selected date
			  let hours = date.getHours();
			  try {
				  let newDate = parse(formData.dateTime, dateTimeFormat, referenceDate)
					newDate.setHours(hours)
				  if (newDate < referenceDate) throw Error("Parsed date is before current date and time") 
				  if (isNaN(newDate)) throw Error("Invalid date");
				  let textDate = format(newDate, dateTimeFormat);
				  setFormData(formData => ({...formData, dateTime: textDate}));
			  } catch (err) {
				  console.log(err);
				  console.log('Could not parse data from datepicker, error above');
			  }
			  return;
		  }
		  setFormData(formData => ({...formData, dateTime: format(date, dateTimeFormat)}))
	  }
	  }
	  onChangeRaw={text => setFormData(formData => ({...formData, dateTime: text}))}
		  showTimeSelect timeFormat="HH" timeIntervals={60} timeCaption='time'
	  placeholderText='Date and time: dd/mm/yy hh' preventOpenOnFocus={true} onBlur={onBlur}
	  	/>
	  <select name='passenger' value={formData.passenger} onChange={onChange} >
	  	<option value='all'>All</option>
	  	<option value='young'>Young</option>
	  	<option value='senior'>Senior</option>
	  	<option value='adult'>Adult</option>
	  </select>
	  <button>Search trains</button>
	  </form>
    </div>
  );
}

export default App;
