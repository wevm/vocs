/** Returns a category's route below the OpenAPI mount. */
export function groupPath(group: groupPath.Group): string {
  return group.pagePath || group.id
}

export declare namespace groupPath {
  /** OpenAPI category fields used to resolve its route. */
  type Group = {
    /** Stable category identifier. */
    id: string
    /** Optional route below the OpenAPI mount. */
    pagePath?: string | undefined
  }
}
