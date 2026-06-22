/**
 * Backs `virtual:vocs/langs` in the prebuilt app. The standalone OpenAPI bundle
 * has no twoslash transformers, so there are no extra Shiki language
 * registrations to load — code samples rely on Shiki's bundled web languages.
 */
export const langs = []
