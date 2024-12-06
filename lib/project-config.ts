import * as fs from "fs";
import path from "path";

export type projectInfo = {
    to: string;                     // email to send patches to
    branch: string;                 // upstream branch a PR must be based on
    cc: string[];                   // emails to always be copied on patches
    urlPrefix: string;              // url to 'listserv' of mail (should it be in mailrepo?)
};

export interface IConfig {
    repo: {
        name: string;               // name of the repo
        owner: string;              // owner of repo holding the notes (tracking data)
        baseOwner: string;          // owner of base repo
        owners: string[];           // owners of clones being monitored (PR checking)
        branches: string[];         // remote branches to fetch - just use trackingBranches?
        closingBranches: string[];  // close if the pr is added to this branch
        trackingBranches: string[]; // comment if the pr is added to this branch
        maintainerBranch?: string;  // branch/owner manually implementing changes
        host: string;
    };
    mailrepo: {
        name: string;
        owner: string;
        branch: string;
        host: string;
        url: string;
        descriptiveName: string;
    };
    mail: {
        author: string;
        sender: string;
    };
    project?: projectInfo | undefined; // project-options values
    app: {
        appID: number;
        installationID: number;
         name: string;
         displayName: string;       // name to use in comments to identify app
         altname: string | undefined; // is this even needed?
    };
    lint: {
        maxCommitsIgnore?: string[]; // array of pull request urls to skip check
        maxCommits: number;         // limit on number of commits in a pull request
    };
    user: {
        allowUserAsLogin: boolean;  // use GitHub login as name if name is private
    };
}

let config: IConfig;                // singleton

/**
 * Query to get the current configuration.
 *
 * @returns IConfig interface
 */
export function getConfig(): IConfig {
    if (config === undefined) {
        throw new Error("project-config not set");
    }

    return config;
}

type importedConfig = { default: IConfig };

/**
 * Load a config.  The config may be a javascript file (plain or generated
 * from typescript) or a json file (with a .json extension).
 *
 * @param file fully qualified filename and path
 * @returns IConfig interface
 */
export async function loadConfig(file: string): Promise<IConfig> {
    let loadedConfig: IConfig;

    if (path.extname(file) === ".js") {
        const { default: newConfig } = (await import(file)) as importedConfig;
        loadedConfig = newConfig;
    } else {
        const fileText = fs.readFileSync(file, { encoding: "utf-8" });
        loadedConfig = JSON.parse(fileText) as IConfig;
    }

    if (loadedConfig === undefined) {
        throw new Error("project-config not set");
    }

    return loadedConfig;
}

/**
 * Set/update the configuration.
 *
 * @param newConfig configuration to be set
 * @returns current IConfig interface
 */
export function setConfig(newConfig: IConfig): IConfig {
    config = newConfig;
    return config;
}
