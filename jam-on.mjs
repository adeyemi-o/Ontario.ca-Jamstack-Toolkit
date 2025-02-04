import { v4 as uuidv4 } from 'uuid';
import { Command } from 'commander';
import { simpleGit as git } from 'simple-git';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import nunjucks from 'nunjucks';
import validate from 'validate-npm-package-name';

const program = new Command();

nunjucks.configure('.jam-on/core/templates');

const outputStarterFile = function (path, content, successMessage) {
  fs.outputFile(path, content, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log(successMessage);
    }
  });
};

const newAction = function (options) {
  if (options.keepGit) {
    console.log('This will remove the example pages and components');
  } else {
    console.log(
      'This will remove any local Git information, and the example pages and components'
    );
  }

  var hasGit;
  var gitIsClean;

  try {
    fs.statSync('.git');
    hasGit = true;
  } catch (e) {
    hasGit = false;
    gitIsClean = true;
  }

  if (hasGit) {
    git().status({}, function (error, status) {
      if (error) {
        console.log('Error in git().status() command: ', error);
        process.exit();
      } else {
        gitIsClean = status.isClean();
      }
    });
  }

  inquirer
    .prompt({
      type: 'confirm',
      name: 'doNew',
      default: false,
      message: 'Proceed?',
    })
    .then((answers) => {
      if (!answers.doNew) {
        console.log('Farewell!');
        process.exit();
      }

      if (gitIsClean && !options.keepGit) {
        console.log(
          'Local Git repo is clean or does not exist, removing any Git information'
        );
        fs.removeSync('.git');
      } else if (!options.keepGit) {
        console.log(
          'Your local Git repo has modifications; please ensure the local git repo is clean and unmodified before running this command'
        );
        console.log('Farewell!');
        process.exit();
      }

      console.log('Creating new project...');

      console.log('Removing example files...');

      const exampleFilesList = [
        'src/_includes/app/components/_example_page_list.njk',
        'src/example-pages',
        'src/pages-dexemple',
        'src/index.njk',
      ];

      exampleFilesList.forEach((filePath, index) => {
        fs.removeSync(filePath);
      });

      inquirer
        .prompt([
          {
            type: 'input',
            name: 'enRoot',
            message: 'What is the English-language subfolder for deployment?',
          },
          {
            type: 'input',
            name: 'frRoot',
            message: 'What is the French-language subfolder for deployment?',
          },
          {
            type: 'input',
            name: 'projectName',
            message:
              'What is the NPM package.json name for this project (use lowercase, hyphens and underscores only)?',
            default: 'new-jam-on-project',
            validate: function (userInput) {
              const validName = validate(userInput).validForNewPackages;
              if (validName) {
                return true;
              } else {
                return 'Invalid package name';
              }
            },
          },
          {
            type: 'input',
            name: 'projectDescription',
            message: 'What is a short description for this project?',
            default: 'New Ontario.ca Jamstack Toolkit project',
          },
        ])
        .then((answers) => {
          console.log('Creating starter files...');

          const newConf = {
            assetsDestination: `${answers.enRoot}/assets`,
            englishRoot: answers.enRoot,
            frenchRoot: answers.frRoot,
            projectName: answers.projectName,
            projectDescription: answers.projectDescription,
            createDate: new Date().toISOString(),
          };

          outputStarterFile(
            '.jam-on/app/conf.json',
            JSON.stringify(newConf),
            'Wrote new config file to .jam-on/app/conf.json'
          );

          const enFileContent = nunjucks.render('en.njk', newConf);

          const frFileContent = nunjucks.render('fr.njk', newConf);

          const redirectFileContent = nunjucks.render('redirect.njk', newConf);

          outputStarterFile(
            `src/${newConf.englishRoot}.njk`,
            enFileContent,
            `Wrote English-side starter file at src/${newConf.englishRoot}.njk`
          );

          outputStarterFile(
            `src/${newConf.frenchRoot}.njk`,
            frFileContent,
            `Wrote French-side starter file at src/${newConf.frenchRoot}.njk`
          );

          outputStarterFile(
            'src/index.njk',
            redirectFileContent,
            `Wrote root-level redirect file at src/index.njk`
          );

          const testFileContent = nunjucks.render('test.njk', newConf);

          outputStarterFile(
            'test/test.js',
            testFileContent,
            `Wrote starter test file at test/test.js`
          );

          const packageFileContent = nunjucks.render('package.njk', newConf);

          outputStarterFile(
            'package.json',
            packageFileContent,
            `Wrote updated NPM package.json file at package.json`
          );
        });
    })
    .catch((error) => {
      console.log(error);
    });
};

const updateAction = function (tagOrBranch, options) {
  console.log(
    `This will replace the 'core' and 'vendor' directories/files of the current project to the versions in Jamstack Toolkit version ${tagOrBranch}`
  );
  inquirer
    .prompt({
      type: 'confirm',
      name: 'doUpdate',
      default: false,
      message: 'Perform the upgrade?',
    })
    .then((answers) => {
      if (!answers.doUpdate) {
        console.log('Farewell!');
        process.exit();
      }
      const tmpDirName = uuidv4();
      console.log(`Updating to branch/tag: ${tagOrBranch}`);

      const coreFileList = [
        [`./${tmpDirName}/src/_data/core`, './src/_data/core'],
        [`./${tmpDirName}/src/_includes/core`, './src/_includes/core'],
        [`./${tmpDirName}/src/assets/img/core`, './src/assets/img/core'],
        [`./${tmpDirName}/src/assets/css/core`, './src/assets/css/core'],
        [`./${tmpDirName}/src/assets/js/core`, './src/assets/js/core'],
        [`./${tmpDirName}/src/assets/vendor`, './src/assets/vendor'],
        [`./${tmpDirName}/.core-eleventy.js`, './.core-eleventy.js'],
        [`./${tmpDirName}/.jam-on/core`, './.jam-on/core'],
        [`./${tmpDirName}/jam-on.mjs`, './jam-on.mjs'],
      ];

      const repoUrls = {
        odsGitLab:
          'https://git.ontariogovernment.ca/service-integration/application-development-toolkit/jamstack-application-toolkit',
        odsGitHub:
          'https://github.com/ongov/Ontario.ca-Jamstack-Application-Toolkit',
      };

      const defaultRepoUrl = repoUrls.odsGitHub;
      const repoUrl = options.repo ? options.repo : defaultRepoUrl;

      git().clone(
        repoUrl,
        tmpDirName,
        { '--depth': 1, '--branch': `${tagOrBranch}` },
        function (error) {
          if (error) {
            console.log('Error cloning specified repo');
            console.log(error);
            process.exit();
          }
          console.log(
            `Checked out tag/branch ${tagOrBranch} to temporary directory ${tmpDirName}`
          );
          coreFileList.forEach((filePathStruct, idx) => {
            console.log(
              `Replacing ${filePathStruct[1]} with ${filePathStruct[0]}`
            );
            fs.copySync(filePathStruct[0], filePathStruct[1]);
          });
          fs.removeSync(tmpDirName);
          console.log(`Removed temporary directory ${tmpDirName}`);
        }
      );
    })
    .catch((error) => {
      console.log(error);
    });
};

program
  .name('jam-on')
  .description('Developer CLI for Ontario.ca Jamstack Toolkit')
  .version('0.2.0');

program
  .command('new')
  .description(
    'put a newly cloned toolkit project into a ready state for development'
  )
  .option('--keepGit', 'Do not delete the local .git folder (optional)')
  .action((options) => newAction(options));

program
  .command('update')
  .description('Update an existing Ontario.ca Jamstack project')
  .argument('<tagOrBranch>', 'tag or branch to update to (required)')
  .option(
    '-r, --repo <repo>',
    'repo URL to use, defaults to ODS GitLab (optional)'
  )
  .action((tagOrBranch, options) => updateAction(tagOrBranch, options));

program.parse();
