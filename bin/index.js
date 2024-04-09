#!/usr/bin/env node

const simpleGit = require("simple-git");
const yargs = require("yargs");
const chalk = require("chalk")
const boxen = require("boxen");
var Chart = require('cli-chart');
const { stringify } = require("querystring");


function showHelp() {                                                            
    console.log(usage);  
    console.log('\nOptions:\r')  
    console.log('\t--version\t      ' + 'Show version number.' + '\t\t' + '[boolean]\r')  
    console.log('\t-b, --branches\t' + '      Branch you want to analyse      ' + '       [string]\r' )  
    console.log('\t--help\t\t      ' + 'Show help.' + '\t\t\t' + '[boolean]\n')  
}

async function getCommitsPerDay(branchName, lastDays) {
    try {
        const git = simpleGit();

      // Calculate the date 30 days ago
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - lastDays);

      // Check if sinceDate is a valid date
      if (isNaN(sinceDate.getTime())) {
          throw new Error('Invalid date calculated.');
      }

      // Convert sinceDate to a string in 'YYYY-MM-DD' format
      const sinceDateString = sinceDate.toISOString().slice(0, 10);
      
        const { all: commitList } = await git.raw([
            'log',
            branchName, // Specify the branch name
            `--since=${sinceDateString}`, // Use the calculated date string
            '--format=%cd',
            '--date=short'
        ]);
        // Log the output of git log for debugging
        console.log('Git log output:', commitList);

        // Check if commitList is undefined or empty
        if (!commitList || commitList.trim() === '') {
            console.log('No commits found in the last', lastDays, 'days for branch', branchName);
            return {};
        }

        // Count commits per day
        const commitsPerDay = {};
        commitList.split('\n').forEach(commitDate => {
            const date = commitDate.trim();
            commitsPerDay[date] = (commitsPerDay[date] || 0) + 1;
        });

        return commitsPerDay;
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


const usage = chalk.keyword('violet')("\nUsage: gly-git -b <branch> \n"
+ boxen(chalk.green("\n" + "Analyse your github repo's any branch" + "\n"), {padding: 1, borderColor: 'green', dimBorder: true}) + "\n");


const options = yargs
.usage(usage)
.option("-b", {alias:"branch", describe: "Input branch to analyse", type: "string", demandOption: false })
.help(true)
.argv;

const argv = require('yargs/yargs')(process.argv).argv;

async function main(){

var branch_name = yargs.argv.b 

if(branch_name == null){  
    showHelp();  
    return;  
}
if (getRepoPath() === undefined || getRepoPath() === null && branch_name !== null){
    return;
}
if (branch_name !== null&& (await getRepoPath()) !== null) {
    var repo = stringify(await getRepoPath())
    analytics(repo, branch_name);
}
}




async function analytics(repoPath, branch_name){
    try{
        git = simpleGit(repoPath)
        const log = await git.log({from: branch_name});
        const commit_count = log.total;
        const last_commit = log.latest;
        const last_commit_date = last_commit.date;
        const last_committer = last_commit.author_name;
        console.log(`Number of Commits: ${commit_count}`);
        console.log(`Last Commit Date: ${last_commit_date}`);
        console.log(`Last Committer: ${last_committer}`);
        var lastDays = 30;
        getCommitsPerDay(lastDays, branch_name).then(commitsPerDay => {
            if (commitsPerDay !== null) {
                console.log('Commits per day in the last', lastDays, 'days:', commitsPerDay);
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
