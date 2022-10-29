import { PreviousSearch } from './App';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { shortenedStationNames } from './utilityFunctions';
const PreviousSearches = ({ previousSearches, loadSearch, deleteSearch }: { previousSearches: PreviousSearch[], loadSearch: (search: PreviousSearch) => void, deleteSearch: (search: PreviousSearch) => void }) => {
    return (
        <div className='prevSearchesDiv'>
            {previousSearches.map((search: PreviousSearch) => {
                let shortenedOrigin = shortenedStationNames[search.formData.origin as keyof typeof shortenedStationNames];
                let shortenedDestination = shortenedStationNames[search.formData.destination as keyof typeof shortenedStationNames];

                return (
                    <div className='prevSearchDiv' key={search.results.outgoing[0].id} onDoubleClick={loadSearch.bind(null, search)}>
                        <div style={{ display: "flex", columnGap: "2em" }}>
                            <p>{shortenedOrigin} - {shortenedDestination}</p> <AiOutlineCloseCircle style={{ position: "relative", left: "8px", top: "-8px" }} className="prevSearchClose" size={18} onClick={deleteSearch.bind(null, search)}>X</AiOutlineCloseCircle>
                        </div>
                        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                            <p>{search.formData.dateTime}</p>
                            <p>{search.formData.passengers}</p>
                        </div>
                    </div>
                )
            }
            )}
        </div>
    )
}

export default PreviousSearches;