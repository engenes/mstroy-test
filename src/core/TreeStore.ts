import type { ITreeItem, TreeItemId } from '@/types/tree.types.ts';

/**
 * Шпаргалка =)
 * Сложность операций:
 * - getAll(): O(1)
 * - getItem(id): O(1)
 * - getChildren(id): O(1)
 * - getAllChildren(id): O(k) где k - количество потомков
 * - getAllParents(id): O(h) где h - высота дерева
 * - addItem(item): O(1) + обновление индексов
 * - removeItem(id): O(k) + обновление индексов
 * - updateItem(item): O(1) + обновление индексов
 *
 * @class TreeStore
 */

export default class TreeStore {
  /**
   * Исходный массив элементов дерева
   * @private
   */
  public items: ITreeItem[] = [];

  /**
   * Индекс для быстрого доступа к элементам по ID
   * @private
   */
  private itemsMap: Map<TreeItemId, ITreeItem> = new Map();

  /**
   * Кэш дочерних элементов для каждого родителя
   * @private
   */
  private childrenMap: Map<TreeItemId, ITreeItem[]> = new Map();

  /**
   * Кэш цепочек родителей для быстрого получения пути к корню
   * @private
   */
  private parentChainCache: Map<TreeItemId, ITreeItem[]> = new Map();

  public update(items: ITreeItem[]) {
    this.items = items;

    // Построение индексов
    this.buildIndexes();
  }

  /**
   * Возвращает исходный массив всех элементов
   *
   * @returns {ITreeItem[]} Массив всех элементов
   */
  public getAll(): ITreeItem[] {
    return this.items;
  }

  /**
   * Получает элемент по его идентификатору
   *
   * @param {TreeItemId} id - Идентификатор элемента
   * @returns {ITreeItem | undefined} Элемент или undefined если не найден
   */
  public getItem(id: TreeItemId): ITreeItem | undefined {
    return this.itemsMap.get(id);
  }

  /**
   * Получает массив прямых дочерних элементов
   *
   * @param {TreeItemId} id - Идентификатор родительского элемента
   * @returns {ITreeItem[]} Массив дочерних элементов (пустой если детей нет)
   */
  public getChildren(id: TreeItemId): ITreeItem[] {
    return this.childrenMap.get(id) || [];
  }

  /**
   * Получает все дочерние элементы рекурсивно (включая вложенные)
   *
   * @param {TreeItemId} id - Идентификатор родительского элемента
   * @returns {ITreeItem[]} Массив всех потомков
   */
  public getAllChildren(id: TreeItemId): ITreeItem[] {
    const result: ITreeItem[] = [];
    const directChildren = this.getChildren(id);

    for (const child of directChildren) {
      result.push(child);
      // Рекурсивно добавляем всех потомков
      const childDescendants = this.getAllChildren(child.id);
      result.push(...childDescendants);
    }

    return result;
  }

  /**
   * Получает цепочку родительских элементов от элемента до корня
   *
   * @param {TreeItemId} id - Идентификатор элемента
   * @returns {ITreeItem[]} Массив родительских элементов
   */
  public getAllParents(id: TreeItemId): ITreeItem[] {
    // Проверка кэша
    if (this.parentChainCache.has(id)) {
      return [...this.parentChainCache.get(id)!]; // Возвращаем копию!
    }

    const result: ITreeItem[] = [];
    let currentItem = this.getItem(id);

    // Поднимаемся по цепочке родителей до корня
    while (currentItem) {
      result.push(currentItem);

      // Если parent === null, это корневой элемент
      if (currentItem.parent === null) {
        break;
      }

      currentItem = this.getItem(currentItem.parent);
    }

    // Кэшируем результат
    this.parentChainCache.set(id, result);

    return [...result];
  }

  /**
   * Добавляет новый элемент в хранилище
   *
   * @param {ITreeItem} item - Новый элемент для добавления
   */
  public addItem(item: ITreeItem): void {
    // Добавляем в массив и Map

    this.items.push(item);

    this.itemsMap.set(item.id, item);

    // Обновляем childrenMap для родителя
    if (item.parent !== null) {
      const siblings = this.childrenMap.get(item.parent) || [];
      siblings.push(item);
      this.childrenMap.set(item.parent, siblings);

      // Сбрасываем кэш родительских цепочек для всех потомков родителя
      this.invalidateParentChainCache(item.parent);
    }

    // Инициализируем пустой массив детей для нового элемента
    if (!this.childrenMap.has(item.id)) {
      this.childrenMap.set(item.id, []);
    }
  }

  /**
   * Удаляет элемент и все его дочерние элементы рекурсивно
   *
   * @param {TreeItemId} id - Идентификатор элемента для удаления
   * @returns {boolean} true если элемент был удален, false если не найден
   */
  public removeItem(id: TreeItemId): boolean {
    const item = this.getItem(id);

    if (!item) {
      return false;
    }

    // Получаем всех потомков для каскадного удаления
    const allChildren = this.getAllChildren(id);
    const itemsToRemove = [item, ...allChildren];

    for (const itemToRemove of itemsToRemove) {
      const index = this.items.indexOf(itemToRemove);

      if (index > -1) {
        this.items.splice(index, 1);
      }

      this.itemsMap.delete(itemToRemove.id);
      this.childrenMap.delete(itemToRemove.id);
      this.parentChainCache.delete(itemToRemove.id);
    }

    // Удаляем ссылку из childrenMap родителя
    if (item.parent !== null) {
      this.removeFromChildrenMap(item.parent, id);
      this.invalidateParentChainCache(item.parent);
    }

    return true;
  }

  /**
   * Обновляет данные элемента
   *
   * @param {ITreeItem} updatedItem - Обновленные данные элемента
   * @returns {boolean} true если элемент был обновлен, false если не найден
   */
  public updateItem(updatedItem: ITreeItem): boolean {
    const existingItem = this.getItem(updatedItem.id);

    if (!existingItem) {
      return false;
    }

    const oldParent = existingItem.parent;
    const newParent = updatedItem.parent;
    const parentChanged = oldParent !== newParent;

    // Обновляем в массиве
    const index = this.items.indexOf(existingItem);

    if (index > -1) {
      this.items[index] = updatedItem;
    }

    this.itemsMap.set(updatedItem.id, updatedItem);

    if (parentChanged) {
      if (oldParent !== null) {
        this.removeFromChildrenMap(oldParent, updatedItem.id);
        this.invalidateParentChainCache(oldParent);
      }

      if (newParent !== null) {
        const siblings = this.childrenMap.get(newParent) || [];
        siblings.push(updatedItem);
        this.childrenMap.set(newParent, siblings);
        this.invalidateParentChainCache(newParent);
      }

      this.invalidateParentChainCacheRecursive(updatedItem.id);
    }

    return true;
  }

  /**
   * Строит все индексы за один проход массива
   * @private
   */
  private buildIndexes(): void {
    this.itemsMap.clear();
    this.childrenMap.clear();
    this.parentChainCache.clear();

    for (const item of this.items) {
      this.itemsMap.set(item.id, item);

      if (!this.childrenMap.has(item.id)) {
        this.childrenMap.set(item.id, []);
      }
    }

    // Второй проход для заполнения childrenMap
    for (const item of this.items) {
      if (item.parent !== null) {
        const children = this.childrenMap.get(item.parent);

        if (children) {
          children.push(item);
        } else {
          // Если родитель не существует, создаем массив
          this.childrenMap.set(item.parent, [item]);
        }
      }
    }
  }

  /**
   * Сбрасывает кэш родительских цепочек для элемента и всех его потомков
   * @private
   */
  private invalidateParentChainCacheRecursive(id: TreeItemId): void {
    this.parentChainCache.delete(id);

    const children = this.getChildren(id);
    for (const child of children) {
      this.invalidateParentChainCacheRecursive(child.id);
    }
  }

  /**
   * Сбрасывает кэш родительских цепочек для элемента
   * @private
   */
  private invalidateParentChainCache(id: TreeItemId): void {
    // Сброс кэша для элемента и всех его потомков
    this.invalidateParentChainCacheRecursive(id);
  }

  /**
   * Удаляет элемент из массива детей родителя
   * @private
   */
  private removeFromChildrenMap(parentId: TreeItemId, childId: TreeItemId): void {
    const children = this.childrenMap.get(parentId);

    if (children) {
      const index = children.findIndex((child) => child.id === childId);

      if (index > -1) {
        children.splice(index, 1);
      }
    }
  }
}
