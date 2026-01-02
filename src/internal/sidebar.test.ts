import { describe, expect, test } from 'vitest'
import { flatten, fromConfig } from './sidebar.js'

describe('flatten', () => {
  test('empty array', () => {
    expect(flatten([])).toMatchInlineSnapshot(`[]`)
  })

  test('flat items', () => {
    expect(
      flatten([
        { text: 'A', link: '/a' },
        { text: 'B', link: '/b' },
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "link": "/a",
          "text": "A",
        },
        {
          "link": "/b",
          "text": "B",
        },
      ]
    `)
  })

  test('nested items', () => {
    expect(
      flatten([
        { text: 'A', link: '/a' },
        {
          text: 'Group',
          items: [
            { text: 'B', link: '/b' },
            { text: 'C', link: '/c' },
          ],
        },
        { text: 'D', link: '/d' },
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "link": "/a",
          "text": "A",
        },
        {
          "link": "/b",
          "text": "B",
        },
        {
          "link": "/c",
          "text": "C",
        },
        {
          "link": "/d",
          "text": "D",
        },
      ]
    `)
  })

  test('deeply nested items', () => {
    expect(
      flatten([
        {
          text: 'Level 1',
          items: [
            {
              text: 'Level 2',
              link: '/level2',
              items: [
                {
                  text: 'Level 3',
                  items: [
                    { text: 'Leaf 1', link: '/leaf1' },
                    { text: 'Leaf 2', link: '/leaf2' },
                  ],
                },
              ],
            },
            { text: 'Leaf 3', link: '/leaf3' },
          ],
        },
        { text: 'Leaf 4', link: '/leaf4' },
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "link": "/level2",
          "text": "Level 2",
        },
        {
          "link": "/leaf1",
          "text": "Leaf 1",
        },
        {
          "link": "/leaf2",
          "text": "Leaf 2",
        },
        {
          "link": "/leaf3",
          "text": "Leaf 3",
        },
        {
          "link": "/leaf4",
          "text": "Leaf 4",
        },
      ]
    `)
  })

  test('preserves item properties except items', () => {
    expect(
      flatten([
        {
          text: 'Group',
          collapsed: true,
          items: [{ text: 'Item', link: '/item', disabled: true }],
        },
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "disabled": true,
          "link": "/item",
          "text": "Item",
        },
      ]
    `)
  })
})

describe('fromConfig', () => {
  test('returns empty items when config is undefined', () => {
    expect(fromConfig(undefined, '/docs')).toMatchInlineSnapshot(`
      {
        "items": [],
      }
    `)
  })

  describe('array config', () => {
    test('returns items from array config', () => {
      const config = [{ text: 'Getting Started', link: '/docs/getting-started' }]
      expect(fromConfig(config, '/docs')).toMatchInlineSnapshot(`
        {
          "items": [
            {
              "items": [
                {
                  "link": "/docs/getting-started",
                  "text": "Getting Started",
                },
              ],
            },
          ],
        }
      `)
    })

    test('groups consecutive leaf items together', () => {
      const config = [
        { text: 'Item 1', link: '/a' },
        { text: 'Item 2', link: '/b' },
        { text: 'Item 3', link: '/c' },
      ]
      expect(fromConfig(config, '/docs')).toMatchInlineSnapshot(`
        {
          "items": [
            {
              "items": [
                {
                  "link": "/a",
                  "text": "Item 1",
                },
                {
                  "link": "/b",
                  "text": "Item 2",
                },
                {
                  "link": "/c",
                  "text": "Item 3",
                },
              ],
            },
          ],
        }
      `)
    })

    test('separates groups when items have nested children', () => {
      const config = [
        { text: 'Item 1', link: '/a' },
        { text: 'Group', items: [{ text: 'Child', link: '/child' }] },
        { text: 'Item 2', link: '/b' },
      ]
      expect(fromConfig(config, '/docs')).toMatchInlineSnapshot(`
        {
          "items": [
            {
              "items": [
                {
                  "link": "/a",
                  "text": "Item 1",
                },
              ],
            },
            {
              "items": [
                {
                  "link": "/child",
                  "text": "Child",
                },
              ],
              "text": "Group",
            },
            {
              "items": [
                {
                  "link": "/b",
                  "text": "Item 2",
                },
              ],
            },
          ],
        }
      `)
    })

    test('deeply nested sidebar structure', () => {
      const config = [
        { text: 'Introduction', link: '/intro' },
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: '/getting-started/installation' },
            { text: 'Configuration', link: '/getting-started/configuration' },
            {
              text: 'Advanced Setup',
              items: [
                { text: 'Docker', link: '/getting-started/advanced/docker' },
                { text: 'Kubernetes', link: '/getting-started/advanced/k8s' },
              ],
            },
          ],
        },
        { text: 'Quick Start', link: '/quick-start' },
        {
          text: 'API Reference',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/api/overview' },
            {
              text: 'Methods',
              items: [
                { text: 'GET', link: '/api/methods/get' },
                { text: 'POST', link: '/api/methods/post' },
                { text: 'PUT', link: '/api/methods/put' },
                { text: 'DELETE', link: '/api/methods/delete' },
              ],
            },
            {
              text: 'Authentication',
              collapsed: false,
              items: [
                { text: 'OAuth', link: '/api/auth/oauth' },
                { text: 'API Keys', link: '/api/auth/api-keys' },
                {
                  text: 'Advanced',
                  disabled: true,
                  items: [
                    { text: 'JWT', link: '/api/auth/jwt' },
                    { text: 'SAML', link: '/api/auth/saml' },
                  ],
                },
              ],
            },
          ],
        },
        { text: 'FAQ', link: '/faq' },
        { text: 'Changelog', link: '/changelog' },
      ]
      expect(fromConfig(config, '/docs')).toMatchInlineSnapshot(`
        {
          "items": [
            {
              "items": [
                {
                  "link": "/intro",
                  "text": "Introduction",
                },
              ],
            },
            {
              "items": [
                {
                  "link": "/getting-started/installation",
                  "text": "Installation",
                },
                {
                  "link": "/getting-started/configuration",
                  "text": "Configuration",
                },
                {
                  "items": [
                    {
                      "link": "/getting-started/advanced/docker",
                      "text": "Docker",
                    },
                    {
                      "link": "/getting-started/advanced/k8s",
                      "text": "Kubernetes",
                    },
                  ],
                  "text": "Advanced Setup",
                },
              ],
              "text": "Getting Started",
            },
            {
              "items": [
                {
                  "link": "/quick-start",
                  "text": "Quick Start",
                },
              ],
            },
            {
              "collapsed": true,
              "items": [
                {
                  "link": "/api/overview",
                  "text": "Overview",
                },
                {
                  "items": [
                    {
                      "link": "/api/methods/get",
                      "text": "GET",
                    },
                    {
                      "link": "/api/methods/post",
                      "text": "POST",
                    },
                    {
                      "link": "/api/methods/put",
                      "text": "PUT",
                    },
                    {
                      "link": "/api/methods/delete",
                      "text": "DELETE",
                    },
                  ],
                  "text": "Methods",
                },
                {
                  "collapsed": false,
                  "items": [
                    {
                      "link": "/api/auth/oauth",
                      "text": "OAuth",
                    },
                    {
                      "link": "/api/auth/api-keys",
                      "text": "API Keys",
                    },
                    {
                      "disabled": true,
                      "items": [
                        {
                          "link": "/api/auth/jwt",
                          "text": "JWT",
                        },
                        {
                          "link": "/api/auth/saml",
                          "text": "SAML",
                        },
                      ],
                      "text": "Advanced",
                    },
                  ],
                  "text": "Authentication",
                },
              ],
              "text": "API Reference",
            },
            {
              "items": [
                {
                  "link": "/faq",
                  "text": "FAQ",
                },
                {
                  "link": "/changelog",
                  "text": "Changelog",
                },
              ],
            },
          ],
        }
      `)
    })

    test('multiple groups with alternating nested and leaf items', () => {
      const config = [
        { text: 'A', link: '/a' },
        { text: 'B', link: '/b' },
        { text: 'Group 1', items: [{ text: 'C', link: '/c' }] },
        { text: 'D', link: '/d' },
        { text: 'Group 2', items: [{ text: 'E', link: '/e' }] },
        { text: 'Group 3', items: [{ text: 'F', link: '/f' }] },
        { text: 'G', link: '/g' },
        { text: 'H', link: '/h' },
        { text: 'I', link: '/i' },
      ]
      expect(fromConfig(config, '/docs')).toMatchInlineSnapshot(`
        {
          "items": [
            {
              "items": [
                {
                  "link": "/a",
                  "text": "A",
                },
                {
                  "link": "/b",
                  "text": "B",
                },
              ],
            },
            {
              "items": [
                {
                  "link": "/c",
                  "text": "C",
                },
              ],
              "text": "Group 1",
            },
            {
              "items": [
                {
                  "link": "/d",
                  "text": "D",
                },
              ],
            },
            {
              "items": [
                {
                  "link": "/e",
                  "text": "E",
                },
              ],
              "text": "Group 2",
            },
            {
              "items": [
                {
                  "link": "/f",
                  "text": "F",
                },
              ],
              "text": "Group 3",
            },
            {
              "items": [
                {
                  "link": "/g",
                  "text": "G",
                },
                {
                  "link": "/h",
                  "text": "H",
                },
                {
                  "link": "/i",
                  "text": "I",
                },
              ],
            },
          ],
        }
      `)
    })
  })

  describe('object config (path-based)', () => {
    test('matches sidebar key by path prefix', () => {
      const config = {
        '/docs': [{ text: 'Doc Item', link: '/docs/item' }],
        '/blog': [{ text: 'Blog Item', link: '/blog/item' }],
      }
      expect(fromConfig(config, '/docs/getting-started')).toMatchInlineSnapshot(`
        {
          "items": [
            {
              "items": [
                {
                  "link": "/docs/item",
                  "text": "Doc Item",
                },
              ],
            },
          ],
          "key": "/docs",
        }
      `)
    })

    test('returns empty items when no key matches path', () => {
      const config = {
        '/docs': [{ text: 'Doc Item', link: '/docs/item' }],
      }
      expect(fromConfig(config, '/blog')).toMatchInlineSnapshot(`
        {
          "items": [],
        }
      `)
    })

    test('deepest matching path takes precedence', () => {
      const config = {
        '/docs': [{ text: 'Docs', link: '/docs' }],
        '/docs/api': [{ text: 'API', link: '/docs/api' }],
        '/docs/api/v2': [{ text: 'API v2', link: '/docs/api/v2' }],
      }
      expect(fromConfig(config, '/docs/api/v2/methods')).toMatchInlineSnapshot(`
        {
          "items": [
            {
              "items": [
                {
                  "link": "/docs/api/v2",
                  "text": "API v2",
                },
              ],
            },
          ],
          "key": "/docs/api/v2",
        }
      `)
    })

    test('handles sidebar object with backLink', () => {
      const config = {
        '/docs': {
          backLink: true,
          items: [{ text: 'Item', link: '/docs/item' }],
        },
      }
      expect(fromConfig(config, '/docs/page')).toMatchInlineSnapshot(`
        {
          "backLink": true,
          "items": [
            {
              "items": [
                {
                  "link": "/docs/item",
                  "text": "Item",
                },
              ],
            },
          ],
          "key": "/docs",
        }
      `)
    })

    test('handles sidebar object with backLink false', () => {
      const config = {
        '/docs': {
          backLink: false,
          items: [{ text: 'Item', link: '/docs/item' }],
        },
      }
      expect(fromConfig(config, '/docs/page')).toMatchInlineSnapshot(`
        {
          "backLink": false,
          "items": [
            {
              "items": [
                {
                  "link": "/docs/item",
                  "text": "Item",
                },
              ],
            },
          ],
          "key": "/docs",
        }
      `)
    })

    test('complex multi-section object config with deep nesting', () => {
      const config = {
        '/': [{ text: 'Home', link: '/' }],
        '/docs': {
          backLink: true,
          items: [
            { text: 'Overview', link: '/docs/overview' },
            {
              text: 'Guides',
              collapsed: false,
              items: [
                { text: 'Quick Start', link: '/docs/guides/quick-start' },
                {
                  text: 'Advanced',
                  collapsed: true,
                  items: [
                    { text: 'Performance', link: '/docs/guides/advanced/performance' },
                    { text: 'Security', link: '/docs/guides/advanced/security' },
                  ],
                },
              ],
            },
          ],
        },
        '/docs/api': {
          backLink: true,
          items: [
            { text: 'API Home', link: '/docs/api' },
            {
              text: 'REST',
              items: [
                { text: 'Endpoints', link: '/docs/api/rest/endpoints' },
                {
                  text: 'Resources',
                  items: [
                    { text: 'Users', link: '/docs/api/rest/resources/users' },
                    { text: 'Posts', link: '/docs/api/rest/resources/posts' },
                    {
                      text: 'Comments',
                      disabled: true,
                      items: [
                        { text: 'List', link: '/docs/api/rest/resources/comments/list' },
                        { text: 'Create', link: '/docs/api/rest/resources/comments/create' },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              text: 'GraphQL',
              items: [
                { text: 'Schema', link: '/docs/api/graphql/schema' },
                { text: 'Queries', link: '/docs/api/graphql/queries' },
                { text: 'Mutations', link: '/docs/api/graphql/mutations' },
              ],
            },
            { text: 'Changelog', link: '/docs/api/changelog' },
          ],
        },
        '/blog': [
          { text: 'All Posts', link: '/blog' },
          { text: '2024', items: [{ text: 'January', link: '/blog/2024/01' }] },
        ],
      }

      expect(fromConfig(config, '/docs/api/rest/resources/users')).toMatchInlineSnapshot(`
          {
            "backLink": true,
            "items": [
              {
                "items": [
                  {
                    "link": "/docs/api",
                    "text": "API Home",
                  },
                ],
              },
              {
                "items": [
                  {
                    "link": "/docs/api/rest/endpoints",
                    "text": "Endpoints",
                  },
                  {
                    "items": [
                      {
                        "link": "/docs/api/rest/resources/users",
                        "text": "Users",
                      },
                      {
                        "link": "/docs/api/rest/resources/posts",
                        "text": "Posts",
                      },
                      {
                        "disabled": true,
                        "items": [
                          {
                            "link": "/docs/api/rest/resources/comments/list",
                            "text": "List",
                          },
                          {
                            "link": "/docs/api/rest/resources/comments/create",
                            "text": "Create",
                          },
                        ],
                        "text": "Comments",
                      },
                    ],
                    "text": "Resources",
                  },
                ],
                "text": "REST",
              },
              {
                "items": [
                  {
                    "link": "/docs/api/graphql/schema",
                    "text": "Schema",
                  },
                  {
                    "link": "/docs/api/graphql/queries",
                    "text": "Queries",
                  },
                  {
                    "link": "/docs/api/graphql/mutations",
                    "text": "Mutations",
                  },
                ],
                "text": "GraphQL",
              },
              {
                "items": [
                  {
                    "link": "/docs/api/changelog",
                    "text": "Changelog",
                  },
                ],
              },
            ],
            "key": "/docs/api",
          }
        `)

      expect(fromConfig(config, '/docs/guides/quick-start')).toMatchInlineSnapshot(`
        {
          "backLink": true,
          "items": [
            {
              "items": [
                {
                  "link": "/docs/overview",
                  "text": "Overview",
                },
              ],
            },
            {
              "collapsed": false,
              "items": [
                {
                  "link": "/docs/guides/quick-start",
                  "text": "Quick Start",
                },
                {
                  "collapsed": true,
                  "items": [
                    {
                      "link": "/docs/guides/advanced/performance",
                      "text": "Performance",
                    },
                    {
                      "link": "/docs/guides/advanced/security",
                      "text": "Security",
                    },
                  ],
                  "text": "Advanced",
                },
              ],
              "text": "Guides",
            },
          ],
          "key": "/docs",
        }
      `)

      expect(fromConfig(config, '/blog/2024/01')).toMatchInlineSnapshot(`
        {
          "items": [
            {
              "items": [
                {
                  "link": "/blog",
                  "text": "All Posts",
                },
              ],
            },
            {
              "items": [
                {
                  "link": "/blog/2024/01",
                  "text": "January",
                },
              ],
              "text": "2024",
            },
          ],
          "key": "/blog",
        }
      `)
    })
  })
})
