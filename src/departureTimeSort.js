const departureTimeSort = (a,b,asc) => {
	let [departureTimeNumA, departureTimeNumB] = [a,b].map(item => parseInt(item.departureTime.replace(':','')))
	if (departureTimeNumA === departureTimeNumB) return 0
	return asc * (departureTimeNumA > departureTimeNumB ? 1 : -1);
}

export default departureTimeSort
