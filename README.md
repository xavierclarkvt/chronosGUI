# chronosGUI

A parts database front end for a fictional time travel company. Mimics Rock Auto's elegant design style.
Allows users to see a list of configurations, traverse the list of configurations to see how they relate, and edit part values.

Written in pure HTML, JS, and CSS as a challenge. If I could do this again I'd definitely do it in React - modifying the dom in stock JS is annoying.

## Definitions

Configuration: A unit. Every configuration has a corresponding "part," and may have child configurations that link to it. "123123-123123-222abc is the UUID for a configuration that corresponds to a Time Machine part"

Part: The data component of a configuration. Parts can have names, statuses, versions, etc., and some of those values can be changed by users.
