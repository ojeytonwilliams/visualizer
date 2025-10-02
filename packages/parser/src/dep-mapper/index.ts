import { scanDirectory } from './scanner';
import { parse } from './file-parser';
export { type DependencyGraph } from './file-parser';

export const getDependencyGraph = async (rootDir: string) => {
  const files = await scanDirectory(rootDir);
  const dependencyGraph = await parse(files);

  return { dependencyGraph };
};
