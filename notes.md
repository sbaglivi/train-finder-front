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
