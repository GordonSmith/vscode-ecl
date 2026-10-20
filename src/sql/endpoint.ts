import type { IOptions } from "@hpcc-js/comms";
import type { LaunchRequestArguments } from "../debugger/launchRequestArguments";

export const DEFAULT_SQL_PORT = 8510;

export function sqlBaseUrl(args: Pick<LaunchRequestArguments, "protocol" | "serverAddress" | "sqlPort">): string {
    return `${args.protocol}://${args.serverAddress}:${args.sqlPort ?? DEFAULT_SQL_PORT}/`;
}

export function sqlServiceOptions(args: LaunchRequestArguments, user?: string, password?: string): IOptions {
    return {
        baseUrl: sqlBaseUrl(args),
        userID: user,
        password,
        rejectUnauthorized: args.rejectUnauthorized ?? true,
        timeoutSecs: args.timeoutSecs ?? 60
    };
}
