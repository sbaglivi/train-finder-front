import React from "react";
import { TrainWD } from "../types";
const SavedList = ({ deleteSavedTrain, savedTrains, deleteSavedItinerary }: { deleteSavedTrain: Function, savedTrains: { [index: string]: TrainWD[] }, deleteSavedItinerary: (hash: string) => void }) => {
    let results = [];
    const table = (content: React.ReactNode) => {
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
        <table style={{ flex: '0 0 48%' }}>
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

    let first = true;
    for (let itinerary in savedTrains) {
        let [origin, destination] = itinerary.split('-');
        // <td>{train.returning ? 'Ritorno' : 'Andata'}</td>
        let outgoingTr = [], returningTr = [];
        const trFromTrain = (train: TrainWD) => {
            return (
                <tr key={train.id}>
                    <td>{train.date}</td>
                    <td>{train.departureTime}</td>
                    <td>{train.arrivalTime}</td>
                    <td>{train.duration}</td>
                    <td>{train.minPrice}</td>
                    <td>{train.passengers}</td>
                    <td>{train.company}</td>
                    <td onClick={deleteSavedTrain.bind(null, train, origin, destination)}>X</td>
                </tr>
            )
        }
        let tr;
        for (let train of savedTrains[itinerary]) {
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
        if (first) {
            results.push(
                <div key={itinerary} className='savedTripsRow'>
                    <p>{origin} - {destination} <span onClick={deleteSavedItinerary.bind(null, itinerary)}>X</span></p>
                    <div className='savedTripsTableContainer'>
                        <div className='savedTripsColumn'>
                            <p>Andata</p>
                            {table(outgoingTr)}
                        </div>
                        <div className='savedTripsColumn'>
                            <p>Ritorno</p>
                            {table(returningTr)}
                        </div>
                    </div>
                </div>
            )

            first = false;
        } else {

            results.push(
                <div key={itinerary} className='savedTripsRow'>
                    <p>{origin} - {destination} <span onClick={deleteSavedItinerary.bind(null, itinerary)}>X</span></p>
                    <div className='savedTripsTableContainer'>
                        {tbodyOnly(outgoingTr)}
                        {tbodyOnly(returningTr)}
                    </div>
                </div>
            )
        }
    }
    return (
        <div className='savedTripsContainer'>
            {results}
        </div>
    )
}

export default SavedList;