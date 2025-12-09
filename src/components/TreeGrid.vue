<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import {
  type ColDef,
  type GridOptions,
  type GridReadyEvent,
  type ValueGetterParams,
} from 'ag-grid-community';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import type { ITreeItem, ITreeItemWithCategory } from '@/types/tree.types.ts';
import { convertToAgGridFormat, sortTreeItemsDFS } from '@/utils/tree.utils.ts';
import TreeStore from '@/core/TreeStore.ts';

const props = defineProps<{
  items: ITreeItem[];
}>();

const treeStore = reactive(new TreeStore());

watch(() => props.items, (value) => {
  // Для Vue 3 можно было бы использовать composables, тогда не пришлось бы вызывать метод обновления.
  // А сразу получать вычисленные сконевертированные налету значения.
  treeStore.update(value);
}, {
  immediate: true,
  deep: true,
});

const rowData = computed<ITreeItemWithCategory[]>(() => {
  const items = treeStore.items;
  const sortedItems = sortTreeItemsDFS(items, treeStore);

  return convertToAgGridFormat(sortedItems, treeStore);
});

const columnDefs: ColDef[] = [
  {
    headerName: '№ п/п',
    valueGetter: (params: ValueGetterParams) => {
      const rowIndex = params.node?.rowIndex;

      return typeof rowIndex === 'number' ? rowIndex + 1 : '';
    },
    width: 100,
    pinned: 'left',
    suppressMovable: true,
    sortable: false,
    filter: false,
  },
  {
    headerName: 'Категория',
    field: 'category',
    width: 200,
    sortable: true,
    filter: true,
    filterParams: {
      values: ['Группа', 'Элемент'],
    },
    cellRenderer: 'agGroupCellRenderer',
    cellRendererParams: {
      suppressCount: true,
    },
  },
  {
    headerName: 'Наименование',
    field: 'label',
    flex: 1,
    sortable: true,
    filter: true,
  },
];

const gridOptions = computed<GridOptions>(() => ({
  rowSelection: {
    mode: 'singleRow',
    checkboxes: false,
  },
  defaultColDef: {
    suppressHeaderMenuButton: true,
  },
  treeData: true,
  animateRows: false,
  groupDefaultExpanded: -1,
  domLayout: 'autoHeight',
  suppressContextMenu: true,
  suppressCellFocus: false,
  getDataPath: (data: ITreeItemWithCategory) => {
    return treeStore
      .getAllParents(data.id)
      .reverse()
      .map((item) => String(item.id));
  },

  groupDisplayType: 'custom',
  pagination: false,
  rowHeight: 40,
  headerHeight: 45,

  localeText: {
    noRowsToShow: 'Нет данных для отображения',
    loadingOoo: 'Загрузка...',
  },
}));

const onGridReady = (params: GridReadyEvent) => {
  params.api.sizeColumnsToFit();
};

</script>

<template>
  <ag-grid-vue
    class="ag-theme-quartz tree-grid"
    :column-defs
    :row-data
    :grid-options
    @grid-ready="onGridReady"
  />
</template>
