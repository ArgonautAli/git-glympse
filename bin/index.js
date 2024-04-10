#!/usr/bin/env node

const simpleGit = require("simple-git");
const yargs = require("yargs");
const chalk = require("chalk")
const boxen = require("boxen");
const Chart = require('cli-chart');
const { stringify } = require("querystring");


function showHelp() {
    console.log(usage);
    console.log('\nOptions:\r')
    console.log('\t--version\t      ' + 'Show version number.' + '\t\t' + '[boolean]\r')
    console.log('\t-b, --branches\t' + '      Branch you want to analyse      ' + '       [string]\r')
    console.log('\t--help\t\t      ' + 'Show help.' + '\t\t\t' + '[boolean]\n')
}

async function getCommitsPerDay(lastDays, branchName) {
    try {
        const git = simpleGit();



        const log = await git.raw(['log', `--since="${lastDays} days ago"`, branchName])

        const commits = log.split('\n');

        const commitsInDay = Array(lastDays).fill(0);

        // Iterate over commits and count commits for each day
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

async function getRepoPath() {
    try {
        return process.cwd();
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

    if (branch_name == null) {
        showHelp();
        return;
    }
    if (getRepoPath() === undefined || getRepoPath() === null && branch_name !== null) {
        return;
    }
    if (branch_name !== null && (await getRepoPath()) !== null) {
        var repo = stringify(await getRepoPath())
        analytics(repo, branch_name);
    }
}




async function analytics(repoPath, branch_name) {
    try {
        var lastDays = 30;
        git = simpleGit(repoPath)
        const log = await git.log({ from: branch_name, '--since': `${lastDays}.days.ago` });
        const commit_count = log.total;
        const last_commit = log.latest;
        const last_commit_date = last_commit.date;
        const last_committer = last_commit.author_name;
        console.log(`Number of Commits: ${commit_count}`);
        console.log(`Last Commit Date: ${last_commit_date}`);
        console.log(`Last Committer: ${last_committer}`);

        getCommitsPerDay(lastDays, branch_name).then(commitsInDay => {
            if (commitsInDay !== null || commitsInDay !== undefined) {
                var chart = new Chart({
                    width: 120, height: 20, directon: 'y', xlabel: 'Days',
                    ylabel: 'Commits', xmax: lastDays, ymax: 3,
                });

                chart.bucketize(commitsInDay);
                chart.draw();
                process.exit();
                // console.log('Commits per day in the last', lastDays, 'days:', commitsInDay);
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
