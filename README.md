# server-list-ping

Query basic information about Minecraft servers via
[Server List Ping](https://wiki.vg/Server_List_Ping).

## Example

```ts
import { serverListPing } from "jsr:@ud2/server-list-ping";

const status = await serverListPing({ hostname: "127.0.0.1" });
console.log(status);
```

Also check out the [online demo](https://server-list-ping.deno.dev/) and its
source code in `main.ts`.
