import {Train, State, Action} from './App';
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

const Table = ({trains, isReturning, dispatch, searchReturn}:{trains:Train[], isReturning: boolean, dispatch: (action: Action) => void, searchReturn: (train:Train) => void}) => {
    const isDev = true;

    const logTrain = () => {
        let train = trains.find(train => train.id === contextMenuState.clickedTrainId)
        if (train) console.log(train)
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