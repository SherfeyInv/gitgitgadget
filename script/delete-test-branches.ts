import { Octokit } from "@octokit/rest";
import { Command } from "commander";
import { deleteBranches, deletionOptions } from "../lib/delete-ci-test-branches.js";
import { GitHubGlue } from "../lib/github-glue.js";

const description = `Clean up GitHubGlue test branches.

When a test fails, there may be a branch and a pull request left active on the
test repository.  This tool can be run to delete the old branches, which will
cause GitHub to close the pull request.  Branches from two days ago are cleaned
up.

The owner and repository name must be specified.  The cleanup criteria can be
overridden using the --hours or --minutes options.  These would be used
primarily for testing.`;

class GitHubProxy extends GitHubGlue {
    public octo: Octokit;
    public constructor(workDir: string, owner: string, repo: string) {
        super(workDir, owner, repo);
        this.octo = this.client;
    }

    public async authenticate(repositoryOwner: string): Promise<void> {
        await this.ensureAuthenticated(repositoryOwner);
        this.octo = this.client;
    }
}

const commander = new Command();

commander.version("1.0.0")
    .usage("[options]")
    .description(description)
    .requiredOption("-o, --owner <string>", "owner must be specified")
    .requiredOption("-r, --repo <string>", "repository must be specified")
    .option("-h, --hours <number>",
            "how old a branch is before expiring.  This is the hours before last midnight", undefined)
    .option("-m, --minutes <number>", "how old a branch is before expiring.  --hours has priority.", undefined)
    .option("--dry-run", "do not delete the refs (useful for debugging)")
    .parse(process.argv);

interface ICommanderOptions {
    dryRun: boolean | undefined;
    hours: number | undefined;
    minutes: number | undefined;
    owner: string;
    repo: string;
}

if (commander.args.length > 0) {
    commander.help();
}

(async (): Promise<void> => {
    const options: deletionOptions = {};
    const commandOptions = commander.opts<ICommanderOptions>();
    if (commandOptions.dryRun) {
        options.dryRun = true;
    }

    if (commandOptions.hours) {
        options.hours = commandOptions.hours;
    } else if (commandOptions.minutes) {
        options.minutes = commandOptions.minutes;
    }

    const github = new GitHubProxy("", commandOptions.owner, commandOptions.repo);
    await github.authenticate(commandOptions.owner);

    await deleteBranches(github.octo, commandOptions.owner, commandOptions.repo, options);
})().catch((reason: Error) => {
    console.log(`Caught error ${reason}:\n${reason.stack}\n`);
    process.exit(1);
});
