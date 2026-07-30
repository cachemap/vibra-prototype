export type TreeShape<TNode> = {
  childrenOf: (node: TNode) => readonly TNode[];
  idOf: (node: TNode) => string;
};

export const flattenTree = <TNode>(root: TNode, shape: TreeShape<TNode>): TNode[] => [
  root,
  ...shape.childrenOf(root).flatMap((child) => flattenTree(child, shape))
];

export const findTreeNode = <TNode>(
  roots: readonly TNode[],
  id: string,
  shape: TreeShape<TNode>
): TNode | null => {
  for (const root of roots) {
    if (shape.idOf(root) === id) {
      return root;
    }

    const match = findTreeNode(shape.childrenOf(root), id, shape);

    if (match) {
      return match;
    }
  }

  return null;
};

export const pathToTreeNode = <TNode>(
  roots: readonly TNode[],
  id: string,
  shape: TreeShape<TNode>
): TNode[] => {
  for (const root of roots) {
    const nextPath = [root];

    if (shape.idOf(root) === id) {
      return nextPath;
    }

    const childPath = pathToTreeNode(shape.childrenOf(root), id, shape);

    if (childPath.length > 0) {
      return [...nextPath, ...childPath];
    }
  }

  return [];
};
