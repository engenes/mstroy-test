/**
 * Тип идентификатора элемента дерева
 */
export type TreeItemId = string | number;

/**
 * Базовый интерфейс элемента дерева
 *
 * @interface ITreeItem
 * @property {TreeItemId} id - Уникальный идентификатор элемента
 * @property {TreeItemId | null} parent - Идентификатор родительского элемента (null для корневых)
 * @property {string} label - Отображаемое наименование элемента
 */
export interface ITreeItem {
  id: TreeItemId;
  parent: TreeItemId | null;
  label: string;
}

/**
 * Тип категории элемента дерева/
 */
export type TreeItemCategory = 'Группа' | 'Элемент';

/**
 * Расширенный интерфейс элемента с дополнительными вычисляемыми полями
 *
 * @interface ITreeItemWithCategory
 * @extends ITreeItem
 * @property {TreeItemCategory} [category] - Категория элемента (Группа/Элемент)
 * @property {boolean} [hasChildren] - Флаг наличия дочерних элементов
 * @property {string[]} [path] - Путь элемента в дереве для AgGrid
 * @property {number} [level] - Уровень вложенности элемента
 */
export interface ITreeItemWithCategory extends ITreeItem {
  category?: TreeItemCategory;
  hasChildren?: boolean;
  path?: string[];
  level?: number;
}


