// Resolve hook: retry a failed relative import with a `.js` extension.
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) {
      return await nextResolve(specifier + ".js", context);
    }
    throw err;
  }
}
