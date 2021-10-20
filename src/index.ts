import glob from 'fast-glob'
import fs from 'fs'
import path from 'path'
import { parse, SFCDescriptor } from '@vue/compiler-sfc'
import { Project, SourceFile } from 'ts-morph'
// @ts-ignore
import toString from 'vue-sfc-descriptor-to-string'
import VueClassComponentBuilder from './vueClassComponentBuilder'
import assert from 'assert'
import minimist from 'minimist'

async function main() {
    const args = minimist(process.argv.slice(2), {
        default: {
            output: 'output'
        }
    })

    assert.ok(args.output, 'output required')
    assert.ok(args.input, 'input required')

    const project = new Project({
        compilerOptions: {
            declaration: true,
            emitDeclarationOnly: true,
            noEmitOnError: true,
            strict: false,
            noImplicitAny: false,
            allowJs: true, // 如果想兼容 js 语法需要加上
            outDir: 'types' // 可以设置自定义的打包文件夹，如 'types'
        },
        skipAddingFilesFromTsConfig: true
    })

    const relatePathT = path.relative(process.cwd(), path.resolve(process.cwd(), args.input))
    const files = await glob([`${relatePathT}/**/*.js`, `${relatePathT}/**/*.vue`])
    const descriptors: Array<SFCDescriptor & { file?: SourceFile, path: string}> = []

    await Promise.all(
        files.map(async file => {
            if (/\.vue$/.test(file)) {
                const sfc = parse(await fs.promises.readFile(file, 'utf8'))
                const {script} = sfc.descriptor
                if(script && script.content){
                    const sf = project.createSourceFile(file+'.'+script.lang??'js', script.content)
                    descriptors.push({
                        ...sfc.descriptor,
                        file: sf,
                        path: file,
                    })
                }else {
                    descriptors.push({
                        ...sfc.descriptor,
                        path: file
                    })
                }

            }
        })
    )
    for(const desc of descriptors){
        if(desc.file){
            const sf = desc.file
            // sf.getSourceFile().formatText()

            const vueClassBuilder = new VueClassComponentBuilder()
            vueClassBuilder.build(sf)
            sf.formatText()
            const content = sf.getFullText()
            desc.script!.content = content
            // desc.script!.lang = desc.script?.lang == 'jsx'? 'tsx': 'ts'
            desc.script!.attrs = {
                lang:  desc.script?.lang == 'jsx' ? 'tsx' : 'ts'
            }
        }
        const raw = toString(desc)
        const outputPath = desc.path.replace(args.input, args.output)
        await fs.promises.mkdir(path.dirname(outputPath), {recursive: true})
        await fs.promises.writeFile(outputPath, raw, 'utf8')
    }
}

main()