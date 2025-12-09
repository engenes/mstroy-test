import type {
  ITreeItem,
  ITreeItemWithCategory,
  TreeItemCategory,
  TreeItemId,
} from '@/types/tree.types.ts';
import type TreeStore from '@/core/TreeStore.ts';
import type { Reactive } from 'vue';

/**
 * Определяет категорию элемента на основе наличия дочерних элементов
 *
 * @param {ITreeItem} item - Элемент дерева
 * @param {TreeStore} treeStore - Экземпляр хранилища
 * @returns {TreeItemCategory} 'Группа' если есть дети, 'Элемент' если нет
 */
export function determineCategory(
  item: ITreeItem,
  treeStore: Reactive<TreeStore> | TreeStore
): TreeItemCategory {
  const children = treeStore.getChildren(item.id);

  return children.length > 0 ? 'Группа' : 'Элемент';
}

/**
 * Получает путь элемента в дереве для AgGrid tree data
 * Путь представлен в виде массива меток от корня до элемента
 *
 * @param {ITreeItem} item - Элемент дерева
 * @param {TreeStore} treeStore - Экземпляр хранилища
 * @returns {string[]} Массив меток элементов от корня к текущему элементу
 */
export function getItemPath(
  item: ITreeItem,
  treeStore: Reactive<TreeStore> | TreeStore
): string[] {
  const parents = treeStore.getAllParents(item.id);

  // Разворачиваем массив, чтобы путь шел от корня к элементу
  return parents.reverse().map((parent) => parent.label);
}

/**
 * Вычисляет уровень вложенности элемента в дереве
 * Корневые элементы имеют уровень 0
 *
 * @param {ITreeItem} item - Элемент дерева
 * @param {TreeStore} treeStore - Экземпляр хранилища
 * @returns {number} Уровень вложенности (0 для корня)
 */
export function getItemLevel(
  item: ITreeItem,
  treeStore: Reactive<TreeStore> | TreeStore
): number {
  const parents = treeStore.getAllParents(item.id);

  // Уровень = количество родителей - 1 (минус сам элемент)
  return parents.length - 1;
}

/**
 * Преобразует элемент дерева в расширенный формат с дополнительными полями
 *
 * @param {ITreeItem} item - Исходный элемент
 * @param {TreeStore} treeStore - Экземпляр хранилища
 * @returns {ITreeItemWithCategory} Элемент с дополнительными полями
 */
export function enrichTreeItem(
  item: ITreeItem,
  treeStore: Reactive<TreeStore> | TreeStore
): ITreeItemWithCategory {
  const hasChildren = treeStore.getChildren(item.id).length > 0;

  return {
    ...item,
    category: determineCategory(item, treeStore),
    hasChildren,
    path: getItemPath(item, treeStore),
    level: getItemLevel(item, treeStore),
  };
}

/**
 * Преобразует все элементы дерева в формат для отображения в AgGrid.
 * Добавляет вычисляемые поля: category, hasChildren, path, level
 *
 * @param {ITreeItem[]} items - Массив элементов дерева
 * @param {TreeStore} treeStore - Экземпляр хранилища
 * @returns {ITreeItemWithCategory[]} Массив обогащенных элементов
 */
export function convertToAgGridFormat(
  items: ITreeItem[],
  treeStore: Reactive<TreeStore> | TreeStore
): ITreeItemWithCategory[] {
  return items.map((item) => enrichTreeItem(item, treeStore));
}

/**
 * Сортирует элементы дерева в порядке обхода в глубину (DFS)
 * Корневые элементы первыми, затем их дети, и так далее
 *
 * @param {ITreeItem[]} items - Массив элементов для сортировки
 * @param {TreeStore} treeStore - Экземпляр хранилища
 * @returns {ITreeItem[]} Отсортированный массив элементов
 */
export function sortTreeItemsDFS(
  items: ITreeItem[],
  treeStore: Reactive<TreeStore> | TreeStore
): ITreeItem[] {
  const result: ITreeItem[] = [];
  const visited = new Set<TreeItemId>();

  // Рекурсивная функция обхода
  function traverse(itemId: TreeItemId): void {
    if (visited.has(itemId)) return;

    const item = treeStore.getItem(itemId);

    if (!item) return;

    visited.add(itemId);
    result.push(item);

    // Рекурсивно обходим детей
    const children = treeStore.getChildren(itemId);
    for (const child of children) {
      traverse(child.id);
    }
  }

  // Начинаем с корневых элементов (parent === null)
  const rootItems = items.filter((item) => item.parent === null);
  for (const rootItem of rootItems) {
    traverse(rootItem.id);
  }

  return result;
}


