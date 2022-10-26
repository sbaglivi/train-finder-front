import {Train, State, Action} from './App';
import { addRoundtripPrices, stationNameToCamelcase} from './utilityFunctions';
import {useState, useEffect} from 'react';


type Field = {
    key: keyof Train,
    displayedName: string
}
let defaultFields: Field[] = [
    {key: "departureTime", displayedName: "Partenza"},
    {key: "arrivalTime", displayedName: "Arrivo"},
    {key: "duration", displayedName: "Durata"},
    {key: "minPrice", displayedName: "Prezzo"},
    {key: "company", displayedName: "Azienda"},
]
let returnField: Field = {key: "totPrice", displayedName: "Tot"};
let developmentFields: Field[] = [
    {key: "minIndividualPrice", displayedName: "ItaloSingolo"},
    {key: "adult", displayedName: "Adulto(T)"},
    {key: "senior", displayedName: "Senior(T)"},
    {key: "young", displayedName: "Giovane(T)"},
]

const Table = ({trains, isReturning, isDev, dispatch}:{trains:Train[], isReturning: boolean, isDev: boolean, dispatch: (action: Action) => void}) => {
    const logTrain = () => {
        let train = trains.find(train => train.id === contextMenuState.clickedTrainId)
        if (train) console.log(train)
    }

	const searchReturn = async (train:Train) => {
		if (state.trains.chosen[train.company] === train){
			console.log('The train you clicked on is already the one selected')
			return;
		}
		const {prevQuery: {formData: {origin, destination, dateTime, returnDateTime, passengers}, time}, metadata: { italo: { cookies: italoCookies }, trenitalia: {cookies: trenitaliaCookies, cartId}}} = state;
		if ((Date.now() - time)/1000 > 300){
			console.log('More than 5 minutes passed since original request, might be too much!')
			return;
		} 
		let requestBodyBase = {origin: stationNameToCamelcase(origin), destination: stationNameToCamelcase(destination), dateTime, returnDateTime, passengers, company: train.company}
        let requestBody = (train.company === 'trenitalia') ? {...requestBodyBase, goingoutId: train.id, cartId, cookies: trenitaliaCookies} : {...requestBodyBase, inputValue: train.inputValue, cookies: italoCookies};
		try {
			let reqResults = await post('/return', JSON.stringify(requestBody), true)
            if (reqResults?.results?.length){
				console.log('Results.length > 0, updating prices');
				let chosen = {...state.trains.chosen,  [train.company]: train}
				let newReturningTrains = addRoundtripPrices(reqResults, state.trains.returning, chosen, train.company)
				dispatch({type: 'selectOutgoingTrip', payload: {returning: newReturningTrains, chosen, error: reqResults.error}})
			} else 
				console.log('Results.length <= 0, setting Error to '+reqResults.error);
				dispatch({type: 'setError', payload: {error: reqResults.error}});
		} catch (e) {
			console.log('request for '+train.company+' returns failed')
		}
	}

	let [sortOrder, setSortOrder] = useState({by: 'departureTime' as keyof Train, asc: 1});
	let [contextMenuState, setContextMenuState] = useState({position: {x: 0, y: 0}, clickedTrainId: null, visible: false});
    let showMore = 'none';
    let chosenTrains: State['trains']['chosen'];                        // FIX THESE
    let isRoundtrip = false;                                           // FIX THESE 
	let hintNeeded = false;

	const handleRightClick = (e:any) => {
		e.preventDefault()
		const xPos = e.pageX;
		const yPos = e.pageY;
		const parentTr = e.target.closest('tr');
		let trainId;
		if (parentTr === null) trainId = null;
		else trainId = parentTr.dataset.id;
		setContextMenuState({visible: true, clickedTrainId: trainId, position: {x: xPos, y: yPos}});
	}

	const hideMenuOnClick = (e:any) => {
		if (e.target.closest("#contextMenu") === null){
			setContextMenuState(prevState => ({...prevState, clickedTrainId: null, visible: false}));
		}
	}

	useEffect(() => {
		let trows = document.querySelectorAll("#outgoingTbody > tr");
		if (trows === null) return;
		for (let  row of Array.from(trows)){
			row.addEventListener("contextmenu", handleRightClick)
		}
		window.addEventListener("click", hideMenuOnClick);
		return () => {
			let trows = document.querySelectorAll("#outgoingTbody > tr");
			if (trows === null) return;
			for (let  row of Array.from(trows)){
				row.removeEventListener("contextmenu", handleRightClick)
			}
			window.removeEventListener("click", hideMenuOnClick);
		}
	}, [])
    const updateSortOrder = (key: keyof Train) => {
        setSortOrder((oldOrder:{by: string, asc:number}) => {
            if (oldOrder.by === key){
                return {by: oldOrder.by, asc: -1*oldOrder.asc};
            } else {
                return {by: key, asc: 1}
            }
        })
    }
    function sortResults(key: keyof Train){
        updateSortOrder(key); // If this doesn't work because sortOrder has not been applied yet I might have to go back to calling dispatch within useEffect
        let direction: "returning" | "outgoing" = isReturning ? 'returning' : 'outgoing';
        dispatch({type: 'reorderResults', payload: {direction, sortOrder}})
    }
    const minPriceRequiresRoundtrip = (train:Train) => train.minOnewayPrice && train.minPrice !== train.minOnewayPrice;

    let ths = defaultFields.map(field => <th onClick={sortResults.bind(null, field.key)}>{field.displayedName}</th>)
    if (isReturning) ths.push(<th onClick={updateSortOrder.bind(null, returnField.key, setSortOrder)}>{returnField.displayedName}</th>)
    if (isDev) ths = [...ths, ...developmentFields.map(field => <th onClick={updateSortOrder.bind(null, field.key, setSortOrder)}>{field.displayedName}</th>)]
    let trs =  trains.map(train => {
        return (
            <tr key={train.id} data-id={train.id} className={(!isReturning && train.id === chosenTrains[train.company]?.id) ? `${train.company}Selected` : ''} onDoubleClick={(!isReturning && isRoundtrip) ? searchReturn.bind(null, train) : undefined}>
                {defaultFields.map(field => {
                    if (isReturning && field.key === "minPrice" && minPriceRequiresRoundtrip(train)) {
                        if (!hintNeeded) hintNeeded = true;
                        return <td className={'roundtripOnly'}><span>{`Prezzo disponibile solo se compri l'andata con ${train.company}`}</span>{train.minPrice}*</td>
                    }
                    return <td>{train[field.key]}</td>
                })}
                {isReturning ? <td>train[returnField.key]</td> : null}
                {isDev ? developmentFields.map(field => <td style={{display: showMore}}>{train[field.key]}</td>) : null}
            </tr>
        )
    })

    return (
        <>
        <table>
            <thead>
                {ths}
            </thead>
            <tbody>
                {trs}
            </tbody>
        </table>
		{hintNeeded ? <p className='mobileHint'>* Prezzo disponibile solo se compri l'andata con la stessa compagnia.</p> : null}
		<div style={{zIndex: 1, display: contextMenuState.visible ? 'block' : 'none', position: 'absolute', top: `${contextMenuState.position.y}px`, left: `${contextMenuState.position.x}px`}} id="contextMenu">
			<button onClick={logTrain}>Click</button>
		</div>
        </>
    )
}

export default Table;