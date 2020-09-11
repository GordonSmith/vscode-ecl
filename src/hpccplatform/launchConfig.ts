import { AccountService, Activity, VerifyUser, Workunit, WUQuery, WUUpdate, Topology, TargetCluster } from "@hpcc-js/comms";
import { scopedLogger } from "@hpcc-js/util";
import * as vscode from "vscode";
import { LaunchConfigState, LaunchRequestArguments } from "../debugger/launchRequestArguments";

const logger = scopedLogger("launchConfig.ts");

export {
    LaunchRequestArguments
};

export function espUrl(launchRequestArgs: LaunchRequestArguments) {
    return `${launchRequestArgs.protocol}://${launchRequestArgs.serverAddress}:${launchRequestArgs.port}`;
}

export function wuDetailsUrl(launchRequestArgs: LaunchRequestArguments, wuid: string) {
    return `${espUrl(launchRequestArgs)}/?Widget=WUDetailsWidget&Wuid=${wuid}`;
}

export function wuResultsUrl(launchRequestArgs: LaunchRequestArguments, wuid: string, sequence: number) {
    return `${espUrl(launchRequestArgs)}/?Widget=ResultWidget&Wuid=${wuid}&Sequence=${sequence}`;
}

export interface Credentials {
    user: string;
    password: string;
    verified: boolean;
}

const credentials: { [serverAddress: string]: Credentials } = {};

export class LaunchConfig {

    private _config: LaunchRequestArguments;

    constructor(args: LaunchRequestArguments) {
        this._config = {
            ...args,
            protocol: args.protocol || "http",
            abortSubmitOnError: args.abortSubmitOnError !== undefined ? args.abortSubmitOnError : true,
            rejectUnauthorized: args.rejectUnauthorized || false,
            eclccPath: args.eclccPath ? args.eclccPath : "",
            eclccArgs: args.eclccArgs ? args.eclccArgs : [],
            includeFolders: args.includeFolders ? args.includeFolders : "",
            legacyMode: args.legacyMode || "",
            resultLimit: args.resultLimit || 100,
            timeoutSecs: args.timeoutSecs || 60,
            user: args.user || "",
            password: args.password || ""
        };
    }

    credentials(): Credentials {
        let retVal = credentials[this._config.serverAddress];
        if (!retVal) {
            retVal = credentials[this._config.serverAddress] = {
                user: this._config.user,
                password: this._config.password,
                verified: false
            };
        }
        return retVal;
    }

    private verifyUser(): Promise<boolean> {
        const credentials = this.credentials();
        if (credentials.verified) {
            return Promise.resolve(true);
        }
        const acService = new AccountService({
            baseUrl: espUrl(this._config),
            userID: credentials.user,
            password: credentials.password,
            rejectUnauthorized: this._config.rejectUnauthorized,
            timeoutSecs: this._config.timeoutSecs
        });
        return acService.VerifyUser({
            application: "vscode-ecl",
            version: ""
        }).then(response => {
            credentials.verified = true;
            return true;
        }).catch(e => {
            return false;
        });
    }

    private ping(timeout: number = 5000): Promise<LaunchConfigState> {
        const timeoutPrommise = new Promise((resolve, reject) => {
            setTimeout(() => {
                reject("timeout");
            }, timeout);
        });
        const queryPromise = this.verifyUser();
        return Promise.race([timeoutPrommise, queryPromise])
            .then(r => {
                return LaunchConfigState.Ok;
            }).catch(e => {
                return e === "timeout" ? LaunchConfigState.Unreachable : LaunchConfigState.Credentials;
            });
    }

    async promptUserID() {
        const credentials = this.credentials();
        credentials.user = await vscode.window.showInputBox({
            prompt: `User ID (${this._config.name})`,
            password: false,
            value: credentials.user
        }) || "";
    }

    async promptPassword(): Promise<boolean> {
        const credentials = this.credentials();
        credentials.password = await vscode.window.showInputBox({
            prompt: `Password (${this._config.name})`,
            password: true,
            value: credentials.password
        }) || "";
        return false;
    }

    async checkCredentials(): Promise<boolean> {
        switch (await this.ping()) {
            case LaunchConfigState.Ok:
                return true;
            case LaunchConfigState.Credentials:
                for (let i = 0; i < 3; ++i) {
                    await this.promptUserID();
                    await this.promptPassword();
                    if (await this.verifyUser()) {
                        return true;
                    }
                }
                throw new Error("Invalid Credentials.");
            case LaunchConfigState.Unknown:
            case LaunchConfigState.Unreachable:
            default:
                throw new Error("Connection failed.");
        }
    }

    action(): WUUpdate.Action {
        switch (this._config.mode) {
            case "compile":
            case "publish":
                return WUUpdate.Action.Compile;
            case "debug":
                return WUUpdate.Action.Debug;
            case "submit":
            default:
                return WUUpdate.Action.Run;
        }
    }

    isPublish() {
        return this._config.mode === "publish";
    }

    legacyMode(): boolean | undefined {
        switch (this._config.legacyMode) {
            case "true":
                return true;
            case "false":
                return false;
            case "":
            default:
                return undefined;
        }
    }

    includeFolders(): string[] {
        return this._config.includeFolders!.split(",");
    }

    _buildPromise;
    fetchBuild(): Promise<string> {
        if (!this._buildPromise) {
            const activity = Activity.attach({
                baseUrl: espUrl(this._config),
                userID: this._config.user,
                password: this._config.password,
                rejectUnauthorized: this._config.rejectUnauthorized,
                timeoutSecs: this._config.timeoutSecs
            });
            this._buildPromise = activity.refresh().then(activity => {
                return activity.Build;
            });
        }
        return this._buildPromise;
    }

    createWorkunit() {
        return Workunit.create({
            baseUrl: espUrl(this._config),
            userID: this._config.user,
            password: this._config.password,
            rejectUnauthorized: this._config.rejectUnauthorized,
            timeoutSecs: this._config.timeoutSecs
        });
    }

    wuQuery(opts: WUQuery.Request): Promise<Workunit[]> {
        return this.checkCredentials().then(() => Workunit.query({
            baseUrl: espUrl(this._config),
            userID: this._config.user,
            password: this._config.password,
            rejectUnauthorized: this._config.rejectUnauthorized,
            timeoutSecs: this._config.timeoutSecs
        }, opts));
    }

    targetClusters(): Promise<TargetCluster[]> {
        const topology = new Topology({
            baseUrl: espUrl(this._config),
            userID: this._config.user,
            password: this._config.password,
            rejectUnauthorized: this._config.rejectUnauthorized,
            timeoutSecs: this._config.timeoutSecs
        });
        return topology.fetchTargetClusters();
    }
}
