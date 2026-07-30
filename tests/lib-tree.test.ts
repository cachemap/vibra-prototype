import { describe, expect, it } from "vitest";

import { findTreeNode, flattenTree, pathToTreeNode, type TreeShape } from "../lib/tree";

type TestNode = {
  children: TestNode[];
  id: string;
};

const tree: TestNode[] = [
  {
    id: "root-a",
    children: [
      { id: "child-a", children: [] },
      {
        id: "child-b",
        children: [{ id: "grandchild-a", children: [] }]
      }
    ]
  },
  { id: "root-b", children: [] }
];

const shape: TreeShape<TestNode> = {
  childrenOf: (node) => node.children,
  idOf: (node) => node.id
};

describe("lib tree", () => {
  it("flattens a tree root in depth-first order", () => {
    expect(flattenTree(tree[0], shape).map((node) => node.id)).toEqual([
      "root-a",
      "child-a",
      "child-b",
      "grandchild-a"
    ]);
  });

  it("finds a nested node across multiple roots", () => {
    expect(findTreeNode(tree, "grandchild-a", shape)?.id).toBe("grandchild-a");
  });

  it("returns null for a missing node", () => {
    expect(findTreeNode(tree, "missing", shape)).toBeNull();
  });

  it("returns the path to a nested node", () => {
    expect(pathToTreeNode(tree, "grandchild-a", shape).map((node) => node.id)).toEqual([
      "root-a",
      "child-b",
      "grandchild-a"
    ]);
  });

  it("returns an empty path for a missing node", () => {
    expect(pathToTreeNode(tree, "missing", shape)).toEqual([]);
  });
});
