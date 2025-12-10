import { describe, it, expect, beforeEach } from 'vitest';
import TreeStore from '../TreeStore';
import type { ITreeItem } from '@/types/tree.types';

describe('TreeStore', () => {
  let store: TreeStore;

  const getMockItems = (): ITreeItem[] => [
    { id: 1, parent: null, label: 'Root' },
    { id: 2, parent: 1, label: 'Child 1' },
    { id: 3, parent: 1, label: 'Child 2' },
    { id: 4, parent: 2, label: 'Grandchild 1' },
    { id: 5, parent: 2, label: 'Grandchild 2' },
    { id: 6, parent: 3, label: 'Grandchild 3' },
  ];

  beforeEach(() => {
    store = new TreeStore();
    store.update(getMockItems());
  });

  describe('update', () => {
    it('should update items and build indexes', () => {
      const mockItems = getMockItems();
      store.update(mockItems);

      expect(store.getAll()).toEqual(mockItems);
      expect(store.getAll().length).toBe(6);
    });

    it('should rebuild indexes when called multiple times', () => {
      const newItems: ITreeItem[] = [
        { id: 10, parent: null, label: 'New Root' },
        { id: 20, parent: 10, label: 'New Child' },
      ];

      store.update(newItems);

      expect(store.getAll()).toEqual(newItems);
      expect(store.getAll().length).toBe(2);
      expect(store.getItem(1)).toBeUndefined();
    });

    it('should handle empty array', () => {
      store.update([]);

      expect(store.getAll()).toEqual([]);
      expect(store.getAll().length).toBe(0);
    });
  });

  describe('getAll', () => {
    it('should return all items', () => {
      const mockItems = getMockItems();
      store.update(mockItems);

      const result = store.getAll();

      expect(result).toEqual(mockItems);
      expect(result.length).toBe(6);
    });

    it('should return empty array when no items', () => {
      store.update([]);

      const result = store.getAll();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('getItem', () => {
    it.each`
      id    | expectedLabel
      ${1}  | ${'Root'}
      ${2}  | ${'Child 1'}
      ${4}  | ${'Grandchild 1'}
      ${6}  | ${'Grandchild 3'}
    `('should return item with id=$id and label=$expectedLabel', ({ id, expectedLabel }) => {
      const result = store.getItem(id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(id);
      expect(result?.label).toBe(expectedLabel);
    });

    it('should return undefined for non-existent id', () => {
      const result = store.getItem(999);

      expect(result).toBeUndefined();
    });
  });

  describe('getChildren', () => {
    it.each`
      parentId | childrenIds      | childrenCount | description
      ${1}     | ${[2, 3]}        | ${2}          | ${'returns direct children of root'}
      ${2}     | ${[4, 5]}        | ${2}          | ${'returns direct children of node 2'}
      ${3}     | ${[6]}           | ${1}          | ${'returns direct children of node 3'}
      ${4}     | ${[]}            | ${0}          | ${'returns empty array for leaf node'}
      ${999}   | ${[]}            | ${0}          | ${'returns empty array for non-existent id'}
    `('$description', ({ parentId, childrenIds, childrenCount }) => {
      const result = store.getChildren(parentId);

      expect(result.length).toBe(childrenCount);
      expect(result.map((item) => item.id)).toEqual(childrenIds);
    });
  });

  describe('getAllChildren', () => {
    it.each`
      parentId | expectedIds           | expectedCount | description
      ${1}     | ${[2, 4, 5, 3, 6]}    | ${5}          | ${'returns all descendants of root'}
      ${2}     | ${[4, 5]}             | ${2}          | ${'returns all descendants of node 2'}
      ${3}     | ${[6]}                | ${1}          | ${'returns all descendants of node 3'}
      ${4}     | ${[]}                 | ${0}          | ${'returns empty array for leaf node'}
      ${999}   | ${[]}                 | ${0}          | ${'returns empty array for non-existent id'}
    `('$description', ({ parentId, expectedIds, expectedCount }) => {
      const result = store.getAllChildren(parentId);

      expect(result.length).toBe(expectedCount);
      expect(result.map((item) => item.id)).toEqual(expectedIds);
    });
  });

  describe('getAllParents', () => {
    it.each`
      childId | expectedIds  | expectedCount | description
      ${4}    | ${[4, 2, 1]} | ${3}          | ${'returns parent chain for deeply nested node'}
      ${2}    | ${[2, 1]}    | ${2}          | ${'returns parent chain for mid-level node'}
      ${1}    | ${[1]}       | ${1}          | ${'returns only itself for root node'}
      ${999}  | ${[]}        | ${0}          | ${'returns empty array for non-existent id'}
    `('$description', ({ childId, expectedIds, expectedCount }) => {
      const result = store.getAllParents(childId);

      expect(result.length).toBe(expectedCount);
      expect(result.map((item) => item.id)).toEqual(expectedIds);
    });

    it('should return a copy from cache on subsequent calls', () => {
      const firstCall = store.getAllParents(4);
      const secondCall = store.getAllParents(4);

      expect(firstCall).toEqual(secondCall);
      expect(firstCall).not.toBe(secondCall);
    });
  });

  describe('addItem', () => {
    it('should add new item to the store', () => {
      const newItem: ITreeItem = { id: 7, parent: 1, label: 'New Child' };

      store.addItem(newItem);

      expect(store.getItem(7)).toEqual(newItem);
      expect(store.getAll().length).toBe(7);
    });

    it('should add item to parent children map', () => {
      const newItem: ITreeItem = { id: 7, parent: 2, label: 'New Grandchild' };

      store.addItem(newItem);

      const children = store.getChildren(2);
      expect(children.map((item) => item.id)).toContain(7);
      expect(children.length).toBe(3);
    });

    it('should handle adding root item (parent null)', () => {
      const newRoot: ITreeItem = { id: 10, parent: null, label: 'New Root' };

      store.addItem(newRoot);

      expect(store.getItem(10)).toEqual(newRoot);
      expect(store.getItem(10)?.parent).toBeNull();
    });

    it('should initialize empty children map for new item', () => {
      const newItem: ITreeItem = { id: 7, parent: 1, label: 'New Child' };

      store.addItem(newItem);

      const children = store.getChildren(7);
      expect(children).toEqual([]);
    });
  });

  describe('removeItem', () => {
    it('should remove item from store', () => {
      const result = store.removeItem(6);

      expect(result).toBe(true);
      expect(store.getItem(6)).toBeUndefined();
      expect(store.getAll().length).toBe(5);
    });

    it('should remove item and all its children recursively', () => {
      const result = store.removeItem(2);

      expect(result).toBe(true);
      expect(store.getItem(2)).toBeUndefined();
      expect(store.getItem(4)).toBeUndefined();
      expect(store.getItem(5)).toBeUndefined();
      expect(store.getAll().length).toBe(3);
    });

    it('should remove item from parent children map', () => {
      store.removeItem(6);

      const children = store.getChildren(3);
      expect(children.length).toBe(0);
      expect(children.map((item) => item.id)).not.toContain(6);
    });

    it('should return false for non-existent item', () => {
      const result = store.removeItem(999);

      expect(result).toBe(false);
      expect(store.getAll().length).toBe(6);
    });

    it('should handle removing root item with all descendants', () => {
      const result = store.removeItem(1);

      expect(result).toBe(true);
      expect(store.getAll().length).toBe(0);
    });
  });

  describe('updateItem', () => {
    it('should update item properties', () => {
      const updatedItem: ITreeItem = { id: 4, parent: 2, label: 'Updated Label' };

      const result = store.updateItem(updatedItem);

      expect(result).toBe(true);
      expect(store.getItem(4)?.label).toBe('Updated Label');
    });

    it('should return false for non-existent item', () => {
      const updatedItem: ITreeItem = { id: 999, parent: 1, label: 'Ghost' };

      const result = store.updateItem(updatedItem);

      expect(result).toBe(false);
      expect(store.getItem(999)).toBeUndefined();
    });

    it('should handle parent change - move item to new parent', () => {
      const updatedItem: ITreeItem = { id: 4, parent: 3, label: 'Grandchild 1' };

      const result = store.updateItem(updatedItem);

      expect(result).toBe(true);
      expect(store.getItem(4)?.parent).toBe(3);


      const oldParentChildren = store.getChildren(2);
      expect(oldParentChildren.map((item) => item.id)).not.toContain(4);
      expect(oldParentChildren.length).toBe(1);

      const newParentChildren = store.getChildren(3);
      expect(newParentChildren.map((item) => item.id)).toContain(4);
      expect(newParentChildren.length).toBe(2);
    });

    it('should handle moving item to root (parent null)', () => {
      const updatedItem: ITreeItem = { id: 4, parent: null, label: 'Grandchild 1' };

      const result = store.updateItem(updatedItem);

      expect(result).toBe(true);
      expect(store.getItem(4)?.parent).toBeNull();


      const oldParentChildren = store.getChildren(2);
      expect(oldParentChildren.map((item) => item.id)).not.toContain(4);
    });

    it('should invalidate parent chain cache when parent changes', () => {

      const initialParents = store.getAllParents(4);
      expect(initialParents.map((item) => item.id)).toEqual([4, 2, 1]);


      const updatedItem: ITreeItem = { id: 4, parent: 3, label: 'Grandchild 1' };
      store.updateItem(updatedItem);


      const newParents = store.getAllParents(4);
      expect(newParents.map((item) => item.id)).toEqual([4, 3, 1]);
    });

    it('should not change children map when only label is updated', () => {
      const childrenBefore = store.getChildren(2);
      const childrenIdsBefore = childrenBefore.map((item) => item.id);

      const updatedItem: ITreeItem = { id: 4, parent: 2, label: 'New Label Only' };
      store.updateItem(updatedItem);

      const childrenAfter = store.getChildren(2);
      const childrenIdsAfter = childrenAfter.map((item) => item.id);

      expect(childrenIdsAfter).toEqual(childrenIdsBefore);
      expect(childrenAfter.length).toBe(2);
    });
  });
});
