import { describe, it, expect, beforeEach } from 'vitest';
import {
  determineCategory,
  getItemPath,
  getItemLevel,
  enrichTreeItem,
  convertToAgGridFormat,
  sortTreeItemsDFS,
} from '../tree.utils';
import TreeStore from '@/core/TreeStore';
import type { ITreeItem } from '@/types/tree.types';

describe('tree.utils', () => {
  let treeStore: TreeStore;

  const getMockItems = (): ITreeItem[] => [
    { id: 1, parent: null, label: 'Root' },
    { id: 2, parent: 1, label: 'Child 1' },
    { id: 3, parent: 1, label: 'Child 2' },
    { id: 4, parent: 2, label: 'Grandchild 1' },
    { id: 5, parent: 2, label: 'Grandchild 2' },
    { id: 6, parent: 3, label: 'Grandchild 3' },
  ];

  beforeEach(() => {
    treeStore = new TreeStore();
    treeStore.update(getMockItems());
  });

  describe('determineCategory', () => {
    it.each`
      itemId | expectedCategory | description
      ${1}   | ${'Группа'}      | ${'returns "Группа" for root with children'}
      ${2}   | ${'Группа'}      | ${'returns "Группа" for node with children'}
      ${3}   | ${'Группа'}      | ${'returns "Группа" for node with one child'}
      ${4}   | ${'Элемент'}     | ${'returns "Элемент" for leaf node'}
      ${5}   | ${'Элемент'}     | ${'returns "Элемент" for leaf node'}
      ${6}   | ${'Элемент'}     | ${'returns "Элемент" for leaf node'}
    `('$description', ({ itemId, expectedCategory }) => {
      const item = treeStore.getItem(itemId)!;

      const result = determineCategory(item, treeStore);

      expect(result).toBe(expectedCategory);
    });
  });

  describe('getItemPath', () => {
    it.each`
      itemId | expectedPath                              | description
      ${1}   | ${['Root']}                               | ${'returns path for root element'}
      ${2}   | ${['Root', 'Child 1']}                    | ${'returns path for direct child'}
      ${3}   | ${['Root', 'Child 2']}                    | ${'returns path for direct child'}
      ${4}   | ${['Root', 'Child 1', 'Grandchild 1']}    | ${'returns path for deeply nested element'}
      ${5}   | ${['Root', 'Child 1', 'Grandchild 2']}    | ${'returns path for deeply nested element'}
      ${6}   | ${['Root', 'Child 2', 'Grandchild 3']}    | ${'returns path for deeply nested element'}
    `('$description', ({ itemId, expectedPath }) => {
      const item = treeStore.getItem(itemId)!;

      const result = getItemPath(item, treeStore);

      expect(result).toEqual(expectedPath);
    });
  });

  describe('getItemLevel', () => {
    it.each`
      itemId | expectedLevel | description
      ${1}   | ${0}          | ${'returns 0 for root element'}
      ${2}   | ${1}          | ${'returns 1 for direct child of root'}
      ${3}   | ${1}          | ${'returns 1 for direct child of root'}
      ${4}   | ${2}          | ${'returns 2 for grandchild'}
      ${5}   | ${2}          | ${'returns 2 for grandchild'}
      ${6}   | ${2}          | ${'returns 2 for grandchild'}
    `('$description', ({ itemId, expectedLevel }) => {
      const item = treeStore.getItem(itemId)!;

      const result = getItemLevel(item, treeStore);

      expect(result).toBe(expectedLevel);
    });
  });

  describe('enrichTreeItem', () => {
    it('should add category field to item', () => {
      const item = treeStore.getItem(1)!;

      const result = enrichTreeItem(item, treeStore);

      expect(result.category).toBe('Группа');
    });

    it('should add hasChildren field to item', () => {
      const itemWithChildren = treeStore.getItem(1)!;
      const itemWithoutChildren = treeStore.getItem(4)!;

      const resultWithChildren = enrichTreeItem(itemWithChildren, treeStore);
      const resultWithoutChildren = enrichTreeItem(itemWithoutChildren, treeStore);

      expect(resultWithChildren.hasChildren).toBe(true);
      expect(resultWithoutChildren.hasChildren).toBe(false);
    });

    it('should add path field to item', () => {
      const item = treeStore.getItem(4)!;

      const result = enrichTreeItem(item, treeStore);

      expect(result.path).toEqual(['Root', 'Child 1', 'Grandchild 1']);
    });

    it('should add level field to item', () => {
      const rootItem = treeStore.getItem(1)!;
      const childItem = treeStore.getItem(2)!;
      const grandchildItem = treeStore.getItem(4)!;

      const enrichedRoot = enrichTreeItem(rootItem, treeStore);
      const enrichedChild = enrichTreeItem(childItem, treeStore);
      const enrichedGrandchild = enrichTreeItem(grandchildItem, treeStore);

      expect(enrichedRoot.level).toBe(0);
      expect(enrichedChild.level).toBe(1);
      expect(enrichedGrandchild.level).toBe(2);
    });

    it('should preserve original item fields', () => {
      const item = treeStore.getItem(2)!;

      const result = enrichTreeItem(item, treeStore);

      expect(result.id).toBe(2);
      expect(result.parent).toBe(1);
      expect(result.label).toBe('Child 1');
    });

    it('should return object with all enriched fields', () => {
      const item = treeStore.getItem(2)!;

      const result = enrichTreeItem(item, treeStore);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('parent');
      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('hasChildren');
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('level');
    });
  });

  describe('convertToAgGridFormat', () => {
    it('should convert all items in array', () => {
      const items = getMockItems();

      const result = convertToAgGridFormat(items, treeStore);

      expect(result.length).toBe(6);
    });

    it('should enrich each item with additional fields', () => {
      const items = getMockItems();

      const result = convertToAgGridFormat(items, treeStore);

      result.forEach((item) => {
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('hasChildren');
        expect(item).toHaveProperty('path');
        expect(item).toHaveProperty('level');
      });
    });

    it('should preserve original order of items', () => {
      const items = getMockItems();

      const result = convertToAgGridFormat(items, treeStore);

      expect(result.length).toBe(6);
      expect(result[0]?.id).toBe(1);
      expect(result[1]?.id).toBe(2);
      expect(result[2]?.id).toBe(3);
      expect(result[3]?.id).toBe(4);
      expect(result[4]?.id).toBe(5);
      expect(result[5]?.id).toBe(6);
    });

    it('should handle empty array', () => {
      const result = convertToAgGridFormat([], treeStore);

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('sortTreeItemsDFS', () => {
    it('should sort items in DFS order starting from root', () => {
      const items = getMockItems();

      const result = sortTreeItemsDFS(items, treeStore);

      expect(result.map((item) => item.id)).toEqual([1, 2, 4, 5, 3, 6]);
    });

    it('should place root elements first', () => {
      const items = getMockItems();

      const result = sortTreeItemsDFS(items, treeStore);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.id).toBe(1);
      expect(result[0]?.parent).toBeNull();
    });

    it('should place children after their parent', () => {
      const items = getMockItems();

      const result = sortTreeItemsDFS(items, treeStore);

      const rootIndex = result.findIndex((item) => item.id === 1);
      const child1Index = result.findIndex((item) => item.id === 2);
      const child2Index = result.findIndex((item) => item.id === 3);

      expect(child1Index).toBeGreaterThan(rootIndex);
      expect(child2Index).toBeGreaterThan(rootIndex);
    });

    it('should place grandchildren after their parent', () => {
      const items = getMockItems();

      const result = sortTreeItemsDFS(items, treeStore);

      const parentIndex = result.findIndex((item) => item.id === 2);
      const grandchild1Index = result.findIndex((item) => item.id === 4);
      const grandchild2Index = result.findIndex((item) => item.id === 5);

      expect(grandchild1Index).toBeGreaterThan(parentIndex);
      expect(grandchild2Index).toBeGreaterThan(parentIndex);
    });

    it('should handle empty array', () => {
      const result = sortTreeItemsDFS([], treeStore);

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should handle single root item', () => {
      const singleItem: ITreeItem[] = [
        { id: 1, parent: null, label: 'Single Root' },
      ];
      treeStore.update(singleItem);

      const result = sortTreeItemsDFS(singleItem, treeStore);

      expect(result.length).toBe(1);
      expect(result[0]?.id).toBe(1);
    });

    it('should handle multiple root items', () => {
      const multiRootItems: ITreeItem[] = [
        { id: 1, parent: null, label: 'Root 1' },
        { id: 2, parent: null, label: 'Root 2' },
        { id: 3, parent: 1, label: 'Child of Root 1' },
        { id: 4, parent: 2, label: 'Child of Root 2' },
      ];
      treeStore.update(multiRootItems);

      const result = sortTreeItemsDFS(multiRootItems, treeStore);

      expect(result.map((item) => item.id)).toEqual([1, 3, 2, 4]);
    });

    it('should traverse deep branches completely before moving to siblings', () => {
      const deepTree: ITreeItem[] = [
        { id: 1, parent: null, label: 'Root' },
        { id: 2, parent: 1, label: 'Child 1' },
        { id: 3, parent: 1, label: 'Child 2' },
        { id: 4, parent: 2, label: 'Grandchild 1-1' },
        { id: 5, parent: 4, label: 'Great-grandchild 1-1-1' },
      ];
      treeStore.update(deepTree);

      const result = sortTreeItemsDFS(deepTree, treeStore);

      expect(result.map((item) => item.id)).toEqual([1, 2, 4, 5, 3]);
    });
  });
});
