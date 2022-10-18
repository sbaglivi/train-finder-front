import {PreviousSearch} from './App';
const PreviousSearches = ({previousSearches, loadSearch, deleteSearch}:{previousSearches: PreviousSearch[], loadSearch: (search: PreviousSearch) => void, deleteSearch: (search: PreviousSearch) => void}) => {
    return (
        <div className='prevSearchesDiv'>
            {previousSearches.map(search => 
                <div className='prevSearchDiv' key={search.results.outgoing[0].id} onDoubleClick={loadSearch.bind(null, search)}>
                    <p>{search.formData.origin} - {search.formData.destination} <span onClick={deleteSearch.bind(null, search)}>X</span></p>
                    <div style={{display: 'flex', width: '100%', justifyContent: 'space-evenly'}}>
                        <p>{search.formData.dateTime}</p>
                        <p>{search.formData.passengers}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PreviousSearches;