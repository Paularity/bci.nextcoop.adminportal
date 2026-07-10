import { makeStatusTogglePOST } from "../../_lib/status-toggle";

export const POST = makeStatusTogglePOST({ target: "INACTIVE", audit: "DEACTIVATE" });
