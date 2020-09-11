import { EclccErrors, locateClientTools, Workunit } from "@hpcc-js/comms";
import { scopedLogger } from "@hpcc-js/util";
import { LaunchConfig, LaunchRequestArguments } from "./launchConfig";

import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const logger = scopedLogger("sessionWorkurkunit.ts");

function xmlFile(programPath: string): Promise<{ err: EclccErrors, content: string }> {
    return new Promise((resolve, reject) => {
        fs.readFile(programPath, "utf8", function (err, content) {
            resolve({ err: new EclccErrors("", []), content });
        });
    });
}

export function submit(args: LaunchRequestArguments) {
    logger.debug("launchRequest:  " + JSON.stringify(args));
    const launchConfig = new LaunchConfig(args);
    logger.info(`Fetch build version.${os.EOL}`);
    const pathParts = path.parse(launchConfig._config.program);
    let failedWU: Workunit;
    return launchConfig.fetchBuild().then(build => {
        logger.info(`Locating Client Tools.${os.EOL}`);
        return locateClientTools(launchConfig._config.eclccPath, build, launchConfig._config.workspace, launchConfig.includeFolders(), launchConfig.legacyMode());
    }).then((clientTools) => {
        logger.info(`Client Tools:  ${clientTools.eclccPath}.${os.EOL}`);
        logger.info(`Generating archive.${os.EOL}`);
        if (pathParts.ext.toLowerCase() === ".xml") {
            return xmlFile(launchConfig._config.program);
        } else {
            return clientTools.createArchive(launchConfig._config.program);
        }
    }).then(archive => {
        if (launchConfig._config.abortSubmitOnError && archive.err.hasError()) {
            throw new Error(`ECL Syntax Error(s):\n  ${archive.err.errors().map(e => e.msg).join("\n  ")}`);
        }
        logger.info(`Archive Size: ${archive.content.length}.${os.EOL}`);
        return archive;
    }).then(archive => {
        logger.info(`Creating workunit.${os.EOL}`);
        return launchConfig.createWorkunit().then(wu => {
            failedWU = wu;
            return [wu, archive] as [Workunit, any];
        });
    }).then(([wu, archive]) => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<Workunit>(async (resolve, reject) => {
            const attempts = 3;
            let lastError;
            for (let retry = 1; retry <= attempts; ++retry) {
                logger.info(`Updating workunit (${retry} of ${attempts}).${os.EOL}`);
                await wu.update({
                    Jobname: pathParts.name,
                    QueryText: archive.content,
                    ApplicationValues: {
                        ApplicationValue: [{
                            Application: "vscode-ecl",
                            Name: "filePath",
                            Value: launchConfig._config.program
                        }]
                    }
                }).then(wu => {
                    retry = attempts + 1;
                    resolve(wu);
                }).catch(e => {
                    lastError = e || lastError;
                });
            }
            reject(lastError);
        });
    }).then((workunit) => {
        logger.info(`Submitting workunit:  ${workunit.Wuid}.${os.EOL}`);
        return workunit.submit(launchConfig._config.targetCluster, launchConfig.action(), launchConfig._config.resultLimit);
    }).then((workunit) => {
        logger.info(`Submitted:  ${launchConfig.wuDetailsUrl(workunit.Wuid)}.${os.EOL}`);
        failedWU = undefined;
        return workunit;
    }).catch((e) => {
        logger.info(`Launch failed - ${e}.${os.EOL}`);
        logger.debug("InitializeEvent");
        if (failedWU) {
            failedWU.setToFailed();
        }
        return undefined;
    });
}