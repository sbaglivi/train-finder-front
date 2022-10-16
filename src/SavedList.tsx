import React from "react";
import {TrainWD} from "./App";
const SavedList = ({deleteSavedTrain, savedTrains}: {deleteSavedTrain: Function, savedTrains: {[index: string]: TrainWD[]}}) => {
    let results = [];
    const table = (content:React.ReactNode) => {
        return (
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Partenza</th>
                        <th>Arrivo</th>
                        <th>Durata</th>
                        <th>Prezzo</th>
                        <th>Passeggeri</th>
                        <th>Azienda</th>
                        <th>X</th>
                    </tr>
                </thead>
                <tbody>
                    {content}
                </tbody>
            </table>
        )
    }
    const tbodyOnly = (content: React.ReactNode) => (
        <table style={{flex: '0 0 48%'}}>
            <tbody>
                {content}
            </tbody>
        </table>
    )
    const heading = (
        <div>
            <div className='savedTripsTableContainer'>
                <div className="headingColumn">
                    <h3>Andata</h3>
                        <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Partenza</th>
                                <th>Arrivo</th>
                                <th>Durata</th>
                                <th>Prezzo</th>
                                <th>Passeggeri</th>
                                <th>Azienda</th>
                                <th>X</th>
                            </tr>
                        </thead>
                        </table>
                    </div>
                    <div className="headingColumn">
                        <h3>Ritorno</h3>
                        <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Partenza</th>
                                <th>Arrivo</th>
                                <th>Durata</th>
                                <th>Prezzo</th>
                                <th>Passeggeri</th>
                                <th>Azienda</th>
                                <th>X</th>
                            </tr>
                        </thead>
                        </table>
                    </div>
                </div>
        </div>
    )

    for (let itinerary in savedTrains){
        let [origin, destination] = itinerary.split('-');
        // <td>{train.returning ? 'Ritorno' : 'Andata'}</td>
        let outgoingTr = [], returningTr = [];
        const trFromTrain = (train:TrainWD) => {
            return (
                <tr key={train.id}>
                    <td>{train.date}</td>
                    <td>{train.departureTime}</td>
                    <td>{train.arrivalTime}</td>
                    <td>{train.duration}</td>
                    <td>{train.minPrice}</td>
                    <td>{train.passengers}</td>
                    <td>{train.company}</td>
                    <td onClick={deleteSavedTrain.bind(null,train, origin, destination)}>X</td>
                </tr>
            )
        }
        let tr;
        for (let train of savedTrains[itinerary]){
            tr = trFromTrain(train);
            train.returning ? returningTr.push(tr) : outgoingTr.push(tr);
        };
        /*
        results.push(
            <div key={itinerary} className='savedTripsRow'>
                <p>{origin} - {destination}</p>
                <div className='savedTripsTableContainer'>
                    <div className='savedTripsColumn' >
                        <h3>Andata</h3>
                        {table(outgoingTr)}
                    </div>
                    <div className='savedTripsColumn' >
                        <h3>Ritorno</h3>
                        {table(returningTr)}
                    </div>
                </div>
            </div>
        )
        */
       results.push(
        <div key={itinerary} className='savedTripsRow'>
            <p>{origin} - {destination}</p>
            <div className='savedTripsTableContainer'>
                {tbodyOnly(outgoingTr)}
                {tbodyOnly(returningTr)}
            </div>
        </div>
       )
    }
    return (
        <div className='savedTripsContainer'>
            {heading}
            {results}
        </div>
    )
}

export default SavedList;