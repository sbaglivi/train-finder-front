When the user types something (onChange) I need to start the search and display relevant results. Maybe I can 
start after 3 characters or something since at the beginning I won't have much information but we'll see.

To display results I need to create (or show) a <ul> in order of 

When should the results be shown?
When user has typed something and focus is on the input

When the user presses enter or tab
- fill input
- move focus to next input field

---

When the form content changes and a new search is made, what do I need to reset?

if offers are on:
- change in going out depstation changes everything
- change in going out time changes everything
- change in going out arrstation changes everything
- change in coming back time should change only ret results
- change in passengers changes everything
- change in trains having offers changes return results
(prices with offers will always be <= than without so no point doing another search until something else changes)

offers are off:
- change in going out depstation changes everything
- change in going out time changes going out results
- change in going out arrstation changes everything
- change in coming back time change only ret results
- change in passengers changes everything
- change in trains no longer having offers changes nothing 

so possibilities are:
- nothing
- everything
- going out results (only if no offers and only time changes)
- return results if changes in coming back time (offers on or off) and if switching on offers


---

If going out only search:
- I always wipe out return results
- Only case in which I don't change it is if datetime / origin / destination stay the same which means that 
   user either only removed the coming back time or somehow changed the noAR even though it should not be shown

if roundtrip:

---
How to split state:
- results can be either a single object with 2 keys or 2 simple arrays. An advantage of using an object would be having a single setter for both
- I need to save the previous query somewhere to know what's changed when the user submits a new one
- I need to save cartId and cookies to be able to make return requests

I think I want a single trains object with outgoing: [], returning: [] structure

And another object for prev query and cartid and cookies. I don't know how to call it and its parts.

prevQuery? formdata, returnMetadata, 



outgoingtrips: {italo: '', trenitalia: ''}

id / inputValue, one for trenitalia and one for italo

I need data about the query for return results as well (this means just the outgiong trip selected)

Data that it's displayed:
2 lists of train results

previousQuery: formdata, time, returnQuery: {italo: id, inputVal, cookies, trenitalia: id, cartid, cookies}}

data about outgoing requests: formdata and a time stamp
data about return requests: formdata, time stamp and cookies, cartid and train ids

        // if I've done an outgoing request I need to have gotten and now save the cookies etc, it's connected to timestamp update 
        // if doing a research without inserting return gives back a cartid and cookies for making a return request then I also 
        // need to remake the request for outgoing results in order to get cookies if someone switches noAR off otherwise return search might fail
        // only exception is if someone has made a request with return previously, in that case I can save the data pre-emptively
            // outgoing is dependent on origin/dest/dateTime/passengers
            // ret is dependent on anything


---

When the user searches for return results the selected trip should get hightlighted. If he selects one trip per company
each of the trips should use a different color. 
The results should match the color of the outgoing trip they're connected to.
The return results should not be hard, once I have decided colors I can just do backgroundColor: company === x ? 'red' : 'green'
For the outgoing trip either I make a very long string or maybe I can create a class ?
long str: selected[result.company] === result.id ? (result.company === 'italo' ? 'blue' : 'green') : 'black'
class: className={selected[result.company] === result.id ? '${result.company}-selected' : ''} saves the color portion


---

I think the best funtionality would require showing prices both conditioned on buying a/r with a company and independently.
In order to do this whenever the user makes a roundtrip searh I have to send 2 requests, one with metadata the other without
Bullshit: when the user submits the research I'll send the outgoing research and the coming back without a/r. Then once he selects
an outgoing trip I'll have to merge the new data with the old

I'll get res1 and res2. Both without metadata since they're not outgoing trips.
I have to merge these 2 objects on same departure/arrival times to create a table that has both pricing data points.
This actually needs to happen for italo as well which overall means 4 requests for return trips. It's a lot and I'm not sure
how worth it is but w/e

I think it would be really cool to be able to show a loading indicator after submitting that tracks what operation is going on
at a giving moment: e.g. waiting on response from x - processing data -  etc.

I think we also need the error field back somewhere.

weird part is that I'm going to have to merge the data from return discounts on the front end? If the results are cached
I could also do it in the js back end but even that doesn't sound appealing, ideally I would've preferred to do it in python


--- 
ways the user changes current situation:
- search form submit
    - new one way search -> sets prevquery to formdata, resets metadata, sets outgoing to results and returning to [],  sets chosen to nothing, sets error to error (maintains nothing?)
    - new return results search (only return time changed) -> set prevquery to formdata, sets return to found (maintains outgoing / metadata, in theory chosen, in practice no?)
    - new full search -> sets outgoing and returnign to results, metadata to metadata, prevquery to formdata, error to error, chosen to nothing (maintains nothing)
- selecting an outgoing result -> sets returning to updated return results, error to error, sets chosen to chosen (maintains rest: metadata, outgoing, prevQuery)


---
Interesting ideas:
- I could calculate a coefficient of how close trains departure times are to the desired ones and let the user sort by that
- maybe a cumulative duratoin as well


if return price is = to oneway price then totprice should be lowest of outgoing trains + this train, without matching company, in that case I display a note

Voglio che minPrice sia effettivamente il prezzo minimo ma che poi possa non essere utilizzato nel prezzo totale o voglio che sia quello utilizzato nel prezzo totale ma non necessariamente il minimo?


{
    milano-firenze: Train[],
    roma-bologna: Train[dfsfmactempelapsedsllkh
}


if not returning roundtrip tr needs function to search return resutls
ifa not returning and train id matches chosen train id then it should get a class 

codice per ricerca risultati del ritorno e aggiornamento prezzi  - fatto?
manca codice per hint (prezzo ritorno)
codice per menu tasto destro

current issues:
all ths are shown, none are being hidden / collapsed. 
Somewhere a key parameter is still missing
I need to make  2 params on table optional (only needed on one of the two)
Style is not being applied correctly to table header