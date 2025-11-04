# chronosGUI

A parts database front end for a fictional time travel company. Mimics Rock Auto's elegant design style.

TODO:

- [ ] Create display of parts / configurations, starting with root config
  - [ ] Create display of part info
  - [ ] Allow authorized edits for part info (only certain attributes are allowed)

Make sure it's obvious how configurations are linked (tree, but maybe also list of "this config/part is used in...")

curl 'https://ssuowapy4e.execute-api.us-east-1.amazonaws.com/prod/api/parts/ec332ad9-f96d-46e2-bdc4-7c9a10419644' \
 -X PUT \
 -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:140.0) Gecko/20100101 Firefox/140.0' \
 -H 'Accept: application/json' \
 -H 'Accept-Language: en-US,en;q=0.5' \
 -H 'Accept-Encoding: gzip, deflate, br, zstd' \
 -H 'Referer: https://ssuowapy4e.execute-api.us-east-1.amazonaws.com/prod/api/parts/ec332ad9-f96d-46e2-bdc4-7c9a10419644' \
 -H 'x-api-key: API-KEY' \
-H 'Content-Type: application/json' \
 -H 'Origin: https://ssuowapy4e.execute-api.us-east-1.amazonaws.com' \
 -H 'DNT: 1' \
 -H 'Connection: keep-alive' \
 -H 'Sec-Fetch-Dest: empty' \
 -H 'Sec-Fetch-Mode: cors' \
 -H 'Sec-Fetch-Site: same-origin' \
 -H 'Priority: u=0' \
 -H 'Pragma: no-cache' \
 -H 'Cache-Control: no-cache' \
 -H 'TE: trailers' \
 --data-raw $'{\n "name": "Time Machoman"\n}'

{
"success": false,
"error": {
"name": "ZodError",
"message": "[\n {\n \"code\": \"custom\",\n \"path\": [],\n \"message\": \"At least one field must be provided\"\n }\n]"
}
}
