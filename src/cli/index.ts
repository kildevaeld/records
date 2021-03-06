
import * as program from 'commander';
import { Generator } from '../generator'
import { Description } from '../visitor'
import * as chalk from 'chalk';
const pkg = require('../../package.json');
import * as hbs from 'handlebars'
import * as _ from 'lodash'

const helpTemplate = (desc: Description) => {

    let o = Object.assign({}, desc, {
        name: chalk.bold(desc.name)
    })

    _.each(_.values(o.annotations.records), (m) => {
        m.arguments = chalk.cyan(m.arguments);
    })

    _.each(_.values(o.annotations.properties), (m) => {
        m.arguments = chalk.cyan(m.arguments);
    })

    return hbs.compile(`
Template {{name}}

Records
{{#each annotations.records}}
{{#if this.description}}
  \u001b[1mname:\u001b[22m \u001b[36m{{@key}}\u001b[39m, \u001b[1mparameter:\u001b[22m {{this.arguments}}
  {{this.description}}

{{else}}
  \u001b[1mname:\u001b[22m \u001b[36m{{@key}}\u001b[39m, \u001b[1mparameter:\u001b[22m {{this.arguments}}
{{/if}}
{{/each}}
Properties
{{#each annotations.properties}}
{{#if this.description}}
  \u001b[1mname:\u001b[22m \u001b[36m{{@key}}\u001b[39m, \u001b[1mparameter:\u001b[22m {{this.arguments}}
  {{this.description}}

{{else}}
  \u001b[1mname:\u001b[22m \u001b[36m{{@key}}\u001b[39m, \u001b[1mparameter:\u001b[22m {{this.arguments}}
{{/if}}
{{/each}}

`)(o);
}

function listTypes(generator: Generator) {
    let gens = generator.buildins;

    console.log(chalk.bold('Available generators:'))
    for (let g of gens) {
        console.log(g.name);
    }
    console.log('');
}

function generate(generator: Generator, cmd: program.ICommand, files: string[]) {

    let template = cmd['template'];
    let output = cmd['output']

    console.log(chalk.bold("Using template:"), chalk.cyan(template))

    generator.on('write:file', (file) => {
        console.log('  %s %s', 'create', chalk.green(file))
    })

    generator.generate(template, { output: output, split: !!cmd['split'] }, files)
        .then(() => console.log('\nYour files has now been created!\n'))
        .catch(e => console.error(e));

}

function generateHelp(generator: Generator, cmd: program.ICommand, template: string) {
    let t = generator.buildins.find(m => m.name == template);

    if (!t) {
        console.log('Could not find the template: %s', chalk.bold(template));
        return;
    }
    try {
        console.log(helpTemplate(t))
    } catch (e) {
        console.log(e)
    }

}



export async function run() {

    var generator = new Generator();


    await generator.loadBuildins();

    program.version(pkg.version);

    program.command("ls").action(() => {
        listTypes(generator);
    })

    let genCmd = program
        .command('gen')
        .option("-t, --template <template>", 'use templates')
        .option("-o, --output <path>", "out")
        .option("-s, --split", "")
        .arguments('<files...>').action((files) => {
            generate(generator, genCmd, files);
        });

    let astCmd = program.command('ast')
        .arguments('<files...>')
        .option('-p, --position', "Generate full ast with position information", false)
        .action((files) => {
            generator.ast(files)
                .then(ast => {
                    console.log(JSON.stringify(ast.map(m => m.toJSON(false)), null, 2))
                }).catch(e => console.log(e))
        })

    let helpCmd = program
        .command('help <template>')
        .action((template) => {
            generateHelp(generator, helpCmd, template);
        });

    program.parse(process.argv);

    if (!program.args.length) program.help();
}
