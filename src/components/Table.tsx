import { Train, State, Action } from '../types';
import { useState, useEffect } from 'react';
import { AiOutlineInfoCircle, AiOutlineClose } from 'react-icons/ai';


type Field = {
    key: keyof Train,
    displayedName: string
}
let defaultFields: Field[] = [
    { key: "departureTime", displayedName: "Partenza" },
    { key: "arrivalTime", displayedName: "Arrivo" },
    { key: "duration", displayedName: "Durata" },
    { key: "minPrice", displayedName: "Prezzo" },
    { key: "company", displayedName: "Azienda" },
]
let returnField: Field = { key: "totPrice", displayedName: "Totale" };
let developmentFields: Field[] = [
    { key: "minIndividualPrice", displayedName: "ItaloSingolo" },
    { key: "adult", displayedName: "Adulto(T)" },
    { key: "senior", displayedName: "Senior(T)" },
    { key: "young", displayedName: "Giovane(T)" },
]

const Table = ({ trains, isReturning, dispatch, searchReturn, outgoingSelected, returnResults = true, isRoundtrip = false }: { trains: Train[], isReturning: boolean, dispatch: (action: Action) => void, searchReturn?: (train: Train) => void, outgoingSelected?: State['trains']['chosen'], returnResults?: boolean, isRoundtrip?: boolean }) => {
    const isDev = true;

    const logTrain = () => {
        let train = trains.find(train => train.id === contextMenuState.clickedTrainId)
        if (train) console.log(train)
    }

    let [sortOrder, setSortOrder] = useState({ by: 'departureTime' as keyof Train, asc: 1 });
    let [contextMenuState, setContextMenuState] = useState({ position: { x: 0, y: 0 }, clickedTrainId: null, visible: false });

    let showMore = 'none';

    const handleRightClick = (e: any) => {
        e.preventDefault()
        const xPos = e.pageX;
        const yPos = e.pageY;
        const parentTr = e.target.closest('tr');
        let trainId;
        if (parentTr === null) trainId = null;
        else trainId = parentTr.dataset.id;
        setContextMenuState({ visible: true, clickedTrainId: trainId, position: { x: xPos, y: yPos } });
    }

    const hideMenuOnClick = (e: any) => {
        if (e.target.closest(`#${isReturning ? "returning" : "outgoing"}ContextMenu`) === null) {
            setContextMenuState(prevState => ({ ...prevState, clickedTrainId: null, visible: false }));
        }
    }

    useEffect(() => {
        let tbodyId = isReturning ? "returningTbody" : "outgoingTbody";
        let trows = document.querySelectorAll(`#${tbodyId} > tr`);
        if (trows === null) return;
        for (let row of Array.from(trows)) {
            row.addEventListener("contextmenu", handleRightClick)
        }
        window.addEventListener("click", hideMenuOnClick);
        return () => {
            let tbodyId = isReturning ? "returningTbody" : "outgoingTbody";
            let trows = document.querySelectorAll(`#${tbodyId} > tr`);
            if (trows === null) return;
            for (let row of Array.from(trows)) {
                row.removeEventListener("contextmenu", handleRightClick)
            }
            window.removeEventListener("click", hideMenuOnClick);
        }
    }, [])
    const updateSortOrder = (key: keyof Train) => {
        setSortOrder((oldOrder: { by: string, asc: number }) => {
            if (oldOrder.by === key) {
                return { by: oldOrder.by, asc: -1 * oldOrder.asc };
            } else {
                return { by: key, asc: 1 }
            }
        })
    }
    useEffect(() => {
        let direction: "returning" | "outgoing" = isReturning ? 'returning' : 'outgoing';
        dispatch({ type: 'reorderResults', payload: { direction, sortOrder } })
    }, [sortOrder])
    function sortResults(key: keyof Train) {
        updateSortOrder(key); // If this doesn't work because sortOrder has not been applied yet I might have to go back to calling dispatch within useEffect
        // let direction: "returning" | "outgoing" = isReturning ? 'returning' : 'outgoing';
        // dispatch({type: 'reorderResults', payload: {direction, sortOrder}})
    }
    const anyOutgoingSelected = outgoingSelected && (outgoingSelected.italo !== undefined || outgoingSelected.trenitalia !== undefined);
    const isReturningAndAnyOutgoingSelected = isReturning && anyOutgoingSelected;

    let ths = defaultFields.map((field, index) => <th key={index} onClick={sortResults.bind(null, field.key)}>{field.displayedName}</th>)
    if (isReturningAndAnyOutgoingSelected) ths.push(<th key="returning" onClick={updateSortOrder.bind(null, returnField.key, setSortOrder)}>{returnField.displayedName}</th>)
    if (isDev) ths = [...ths, ...developmentFields.map(field => <th key={field.key} style={{ display: showMore }} onClick={updateSortOrder.bind(null, field.key, setSortOrder)}>{field.displayedName}</th>)]
    let trs = trains.map(train => {
        return (
            <tr key={train.id} data-id={train.id} className={(!isReturning && train.id === outgoingSelected![train.company]?.id) ? `${train.company}Selected` : ''} onDoubleClick={(!isReturning && isRoundtrip) ? searchReturn!.bind(null, train) : undefined}>
                {defaultFields.map((field, i) => {
                    if (field.key === "minPrice" && isReturningAndAnyOutgoingSelected) {
                        return <td key={i}>{train.minOnewayPrice}</td>
                    }
                    return <td key={i} >{train[field.key]}</td>
                })}
                {isReturningAndAnyOutgoingSelected ? <td key={returnField.key} ><label className="tooltip">{train[returnField.key]}<AiOutlineInfoCircle size={14} /><input type="checkbox" /><span className="hint">{train.totPriceHint}<AiOutlineClose className={"hintCloseSpan"} size={16} /></span></label></td> : null}

                {isDev ? developmentFields.map(field => <td key={field.key} style={{ display: showMore }}>{train[field.key]}</td>) : null}
            </tr>
        )
    })

    return (
        <div className={`tableDiv ${!returnResults ? "fullWidth" : ""}`}>
            <h2>{isReturning ? "Ritorno" : "Andata"}</h2>
            <table>
                <thead>
                    <tr>
                        {ths}
                    </tr>
                </thead>
                <tbody id={isReturning ? "returningTbody" : "outgoingTbody"}>
                    {trs}
                </tbody>
            </table>
            <div style={{ zIndex: 1, display: contextMenuState.visible ? 'block' : 'none', position: 'absolute', top: `${contextMenuState.position.y}px`, left: `${contextMenuState.position.x}px` }} id={`${isReturning ? "returning" : "outgoing"}ContextMenu`}>
                <button onClick={logTrain}>Click</button>
            </div>
        </div>
    )
}

export default Table;