import { Project, Structure, forEachStructureChild, StructureKind } from 'ts-morph'

import { useDocgen } from '../hooks/useDocgen.js'
import { H2 } from './mdx/H2.js'
import { H3 } from './mdx/H3.js'
import { H4 } from './mdx/H4.js'
import { Paragraph } from './mdx/Paragraph.js'
import { Code } from './mdx/Code.js'

type DocgenProps = { path: string }

export function Docgen(props: DocgenProps) {
  const docgen = useDocgen()

  const project = new Project({ useInMemoryFileSystem: true })
  const sourceFile = project.createSourceFile(props.path, docgen[props.path])
  const structure = sourceFile.getStructure()

  const content: React.ReactNode[] = []

  forEachStructureChild(structure, (child) => {
    if (!Structure.isExportable(child)) return

    if (child.kind === StructureKind.Function) {
      if (child.parameters) {
        content.push(<H2 id="parameters">Parameters</H2>)
        for (const parameter of child.parameters) {
          content.push(<H3 id={parameter.name}>{parameter.name}</H3>)

          if (typeof parameter.type === 'string') {
            const typeAlias = sourceFile.getTypeAlias(parameter.type)
            if (typeAlias) {
              const typeAliasStructure = typeAlias.getStructure()
              const doc = typeAliasStructure.docs?.[0]
              if (typeof doc === 'object' && doc.description)
                content.push(
                  <Paragraph>
                    {typeof doc.description === 'string'
                      ? doc.description
                      : JSON.stringify(doc.description)}
                  </Paragraph>,
                )

              if (typeAlias.getType().isObject()) {
                const properties = typeAlias.getType().getProperties()
                for (const property of properties) {
                  content.push(<H4>{property.getName()}</H4>)
                  const nodes = property.getDeclarations()
                  for (const node of nodes) {
                    // @ts-ignore
                    const structure = node.getStructure()
                    content.push(
                      <Paragraph>
                        <Code>{structure.type}</Code>
                      </Paragraph>,
                    )
                    const doc = structure.docs?.[0]
                    if (typeof doc === 'object') {
                      content.push(<Paragraph>{doc.DocgenProps}</Paragraph>)
                    }
                  }
                }
              } else {
                // TODO: Handle primitive type
              }
            }
          }
        }
      }

      if (child.returnType) {
        content.push(<H2 id="return-type">Return Type</H2>)
        content.push(
          <Paragraph>
            <Code>
              {typeof child.returnType === 'string'
                ? child.returnType
                : JSON.stringify(child.returnType)}
            </Code>
          </Paragraph>,
        )

        if (typeof child.returnType === 'string') {
          const typeAlias = sourceFile.getTypeAlias(child.returnType)
          if (typeAlias) {
            const typeAliasStructure = typeAlias.getStructure()
            const doc = typeAliasStructure.docs?.[0]
            if (typeof doc === 'object') {
              content.push(
                <Paragraph>
                  {typeof doc.description === 'string'
                    ? doc.description
                    : JSON.stringify(doc.description)}
                </Paragraph>,
              )
            }
          }
        }
      }
    }
  })

  return content
}
