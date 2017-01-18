
import * as Path from 'path'
import { Item, BaseVisitor, Description, VisitorOptions, Result } from '../visitor';
import { Type, Modifier, Token } from '../tokens';

export class TypescriptVisitor extends BaseVisitor {
    imports: string[][] = [];

    parse(item: Item) {
        let out = super.parse(item);
        let i = this.imports.map(m => {
            return `import * as ${m[0]} from './${m[1]}'`;
        }).join('\n');
        return i + "\n" + out;
    }

    visitImport(item: Item): any {
        this.imports.push([item[1][0], Path.basename(item[1][1], '.record')]);
    }

    visitPackage(item: Item): any {
        return `// ${item[1]}\n${this.visit(item[2]).join('\n\n')}\n`;
    }
    visitRecord(item: Item): any {
        let props = this.visit(item[2].filter(m => m[0] == Token.Property))
            .join('\n');

        let a = this.visit(item[2].filter(m => m[0] == Token.Modifier && m[1] == Modifier.Annotation))
        let c = !!a.find(a => a.name == 'class')
        return `export ${c ? 'class' : 'interface'} ${item[1]} {\n${props}\n}`;
    }
    visitProperty(item: Item): any {
        let type = this.visit(item[2]);
        let modifiers = this.visit(item[2][2]);
        let isOptional = modifiers.find(m => m === Modifier.Optional) === Modifier.Optional
        let isRepeated = modifiers.find(m => m === Modifier.Repeated) === Modifier.Repeated
        return `  ${item[1]}` + (isOptional ? '?' : '') + ": " + type + (isRepeated ? '[]' : '') + ';'
    }
    visitAnnotation(item: Item): any {
        return this.visit(item[2]);
    }

    visitBuildinType(item: Item): any {
        let type = <Type>item[1]
        switch (type) {
            case Type.Boolean: return "boolean";
            case Type.String: return "string";
            case Type.Date: return "Date";
            default: return "number";
        }

    }
    visitImportType(item: Item): any {
        return item[1].join('.');
    }



    visitModifier(item: Item): any {
        if (item[1] == Modifier.Annotation) {
            return {
                name: item[2],
                value: item[3]
            }
        }
        return item[1];
    }

}

export const Meta: Description = {
    name: "Typescript",
    extname: ".ts",
    run: (item: Item, options: VisitorOptions): Promise<Result[]> => {
        let visitor = new TypescriptVisitor(options);
        let json = visitor.parse(item);

        return Promise.resolve([{
            data: new Buffer(json),
            name: options.file
        }]);
    }
}