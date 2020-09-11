import { AccountService, Activity, VerifyUser, Workunit, WUQuery, WUUpdate, Topology, TargetCluster } from "@hpcc-js/comms";
import { LaunchConfigState, LaunchRequestArguments } from "../debugger/launchRequestArguments";

export {
    LaunchRequestArguments
};

export class LaunchConfig {

    _config: LaunchRequestArguments;

    constructor(args: any) {
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

    verifyUser(userID: string, password: string): Promise<VerifyUser.Response> {
        const acService = new AccountService({
            baseUrl: this.espUrl(),
            userID,
            password,
            rejectUnauthorized: this._config.rejectUnauthorized,
            timeoutSecs: this._config.timeoutSecs
        });
        return acService.VerifyUser({
            application: "vscode-ecl",
            version: ""
        });
    }

    ping(timeout: number = 5000): Promise<LaunchConfigState> {
        const timeoutPrommise = new Promise((resolve, reject) => {
            setTimeout(() => {
                reject("timeout");
            }, timeout);
        });
        const queryPromise = this.verifyUser(this._config.user!, this._config.password!);
        return Promise.race([timeoutPrommise, queryPromise])
            .then(r => {
                return LaunchConfigState.Ok;
            }).catch(e => {
                return e === "timeout" ? LaunchConfigState.Unreachable : LaunchConfigState.Credentials;
            });
    }

    _buildPromise;
    fetchBuild(): Promise<string> {
        if (!this._buildPromise) {
            const activity = Activity.attach({
                baseUrl: this.espUrl(),
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
            baseUrl: this.espUrl(),
            userID: this._config.user,
            password: this._config.password,
            rejectUnauthorized: this._config.rejectUnauthorized,
            timeoutSecs: this._config.timeoutSecs
        });
    }

    wuQuery(opts: WUQuery.Request): Promise<Workunit[]> {
        return Workunit.query({
            baseUrl: this.espUrl(),
            userID: this._config.user,
            password: this._config.password,
            rejectUnauthorized: this._config.rejectUnauthorized,
            timeoutSecs: this._config.timeoutSecs
        }, opts);
    }

    targetClusters(): Promise<TargetCluster[]> {
        const topology = new Topology({
            baseUrl: this.espUrl(),
            userID: this._config.user,
            password: this._config.password,
            rejectUnauthorized: this._config.rejectUnauthorized,
            timeoutSecs: this._config.timeoutSecs
        });
        return topology.fetchTargetClusters();
    }

    espUrl() {
        return `${this._config.protocol}://${this._config.serverAddress}:${this._config.port}`;
    }

    wuDetailsUrl(wuid: string) {
        return `${this.espUrl()}/?Widget=WUDetailsWidget&Wuid=${wuid}`;
    }
}
