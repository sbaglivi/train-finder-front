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