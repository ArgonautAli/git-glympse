#!/usr/bin/env node

const simpleGit = require("simple-git");
const yargs = require("yargs");
const chalk = require("chalk")
const boxen = require("boxen");
const Chart = require('cli-chart');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);


function showHelp() {
    console.log(usage);
    console.log('\nOptions:\r')
    console.log('\t--version\t      ' + 'Show version number.' + '\t\t' + '[boolean]\r')
    console.log('\t-b, --branches\t' + '      Branch you want to analyse      ' + '       [string]\r')
    console.log('\t-t --time\t' + '      Time period     ' + '       [string]\r')
    console.log('\t--help\t\t      ' + 'Show help.' + '\t\t\t' + '[boolean]\n')
}



async function getRepoPath() {
    try {
        return process.cwd();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function getCommitsPerDay(lastDays, branchName) {
    try {
        const git = simpleGit();

        const log = await git.raw(['log', `--since="${lastDays} days ago"`, branchName])

        const commits = log.split('\n');

        const commitsInDay = Array(lastDays).fill(0);

        for (const commit of commits) {
            if (commit.startsWith('Date: ')) {
                const date = new Date(commit.substring(6).trim());
                const dayIndex = Math.min(Math.floor((Date.now() - date.getTime()) / (24 * 3600 * 1000)), 29);
                commitsInDay[dayIndex]++;
            }
        }
        return commitsInDay
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function getCommitLogs(branchName, lastDays) {
    try {
        const { stdout } = await execAsync(`git log --since="${lastDays} days ago" ${branchName}`);
        const commits = stdout.trim().split('\n\ncommit ').map(commit => 'commit ' + commit);
        const lastCommit = commits[0];
        const lastCommitInfo = {
            date: lastCommit.match(/Date:\s+(.+)/)[1],
            author_name: lastCommit.match(/Author:\s+(.+)/)[1].split('<')[0].trim()
        };
        const commitCount = commits.length;

        return { commitCount, lastCommitInfo };
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

const usage = chalk.keyword('violet')("\nUsage: in-git -b <branch> \n"
    + boxen(chalk.green("\n" + "Get insights on any branch of your GitHub repository for better analytics" + "\n"), { padding: 1, borderColor: 'green', dimBorder: true }) + "\n");


const options = yargs
    .usage(usage)
    .option("-b", { alias: "branch", describe: "Input branch to analyse", type: "string", demandOption: false })
    .help(true)
    .argv;

const argv = require('yargs/yargs')(process.argv).argv;

async function main() {

    var branch_name = yargs.argv.b || yargs.argv.branches

    var time_period = yargs.argv.t || yargs.argv.time

    console.log("time_period", time_period)

    if (branch_name == null) {
        showHelp();
        return;
    }
    if (getRepoPath() === undefined || getRepoPath() === null && branch_name !== null && time_period !== null) {
        return;
    }
    if (branch_name !== null && (await getRepoPath()) !== null && time_period !== null) {
        var repo = await getRepoPath();
        console.log("repo1", repo)
        analytics(repo, branch_name, time_period);
    }
}


async function analytics(repoPath, branch_specified, time_period) {
    try {
        var branch_name = branch_specified || "main"
        var lastDays = time_period || 30;
        git = simpleGit(repoPath)

        const commitLogs = await getCommitLogs(branch_specified, time_period);

        if (commitLogs !== null) {
            const { commitCount, lastCommitInfo } = commitLogs;
            console.log(`Number of Commits: ${commitCount}`);
            console.log(`Last Commit Date: ${lastCommitInfo.date}`);
            console.log(`Last Committer: ${lastCommitInfo.author_name}`);
        } else {
            console.log('Failed to retrieve commit logs.');
        }

        getCommitsPerDay(lastDays, branch_name).then(commitsInDay => {
            if (commitsInDay !== null || commitsInDay !== undefined) {
                var chart = new Chart({
                    width: 120, height: 20, directon: 'y', xlabel: 'Days',
                    ylabel: 'Commits', xmax: lastDays, ymax: 3,
                });

                chart.bucketize(commitsInDay);
                chart.draw();
                process.exit();
            } else {
                console.log('An error occurred while fetching commit history.');
            }
        });
    } catch (err) {
        console.log("err", err)
    }
}

main();




// const repo_path = 'https://github.com/ArgonautAli/git-glympse';
// getRepoInfo(repoPath);
