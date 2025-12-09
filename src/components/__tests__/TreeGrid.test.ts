import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import TreeGrid from '../TreeGrid.vue';
import TreeStore from '@/core/TreeStore';
import type { ITreeItem } from '@/types/tree.types';
import * as treeUtils from '@/utils/tree.utils';
import { AgGridVue } from 'ag-grid-vue3';

vi.mock('@/utils/tree.utils', () => ({
  sortTreeItemsDFS: vi.fn((items) => items),
  convertToAgGridFormat: vi.fn((items) => items),
}));

describe('TreeGrid', () => {
  let wrapper: any = null;
  let updateSpy: any = null;

  const mockItems: ITreeItem[] = [
    { id: 1, parent: null, label: 'Root' },
    { id: 2, parent: 1, label: 'Child' },
  ];

  beforeEach(() => {
    // Такое решение, чтобы не лезть во внутренности компонента и не нарушать инкапсуляцию
    updateSpy = vi.spyOn(TreeStore.prototype, 'update');
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    vi.clearAllMocks();
  });

  const getWrapper = () => shallowMount(TreeGrid, {
    props: {
      items: mockItems,
    },
  });

  describe('treeStore.update', () => {
    it('should call treeStore.update on initial mount with items from props', async () => {
      wrapper = getWrapper();
      await nextTick();

      expect(updateSpy).toHaveBeenCalledWith(mockItems);
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    it('should call treeStore.update when items prop changes', async () => {
      wrapper = getWrapper();
      await nextTick();
      updateSpy.mockClear();

      const newItems: ITreeItem[] = [
        { id: 10, parent: null, label: 'New Root' },
        { id: 20, parent: 10, label: 'New Child' },
      ];

      await wrapper.setProps({ items: newItems });
      await nextTick();

      expect(updateSpy).toHaveBeenCalledWith(newItems);
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    it('should call treeStore.update with updated items when prop changes multiple times', async () => {
      wrapper = getWrapper();
      await nextTick();

      updateSpy.mockClear();

      const secondItems: ITreeItem[] = [
        { id: 100, parent: null, label: 'Second Root' },
      ];

      const thirdItems: ITreeItem[] = [
        { id: 200, parent: null, label: 'Third Root' },
        { id: 201, parent: 200, label: 'Third Child' },
      ];

      await wrapper.setProps({ items: secondItems });
      await nextTick();

      expect(updateSpy).toHaveBeenCalledWith(secondItems);

      await wrapper.setProps({ items: thirdItems });
      await nextTick();

      expect(updateSpy).toHaveBeenCalledWith(thirdItems);
      expect(updateSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('ag-grid-vue component props', () => {
    beforeEach(() => {
      vi.mocked(treeUtils.sortTreeItemsDFS).mockReturnValue(mockItems);
      vi.mocked(treeUtils.convertToAgGridFormat).mockReturnValue(mockItems as any);
    });

    it('should pass column-defs prop to ag-grid-vue', () => {
      wrapper = getWrapper();

      const agGrid = wrapper.findComponent(AgGridVue);
      const columnDefs = agGrid.props('columnDefs');

      expect(columnDefs).toBeDefined();
      expect(Array.isArray(columnDefs)).toBe(true);
      expect(columnDefs.length).toBe(3);
    });

    it('should pass column-defs with correct structure', () => {
      wrapper = getWrapper();

      const agGrid = wrapper.findComponent(AgGridVue);
      const columnDefs = agGrid.props('columnDefs');

      expect(columnDefs[0].headerName).toBe('№ п/п');
      expect(columnDefs[0].width).toBe(100);
      expect(columnDefs[0].pinned).toBe('left');

      expect(columnDefs[1].headerName).toBe('Категория');
      expect(columnDefs[1].field).toBe('category');
      expect(columnDefs[1].width).toBe(200);

      expect(columnDefs[2].headerName).toBe('Наименование');
      expect(columnDefs[2].field).toBe('label');
      expect(columnDefs[2].flex).toBe(1);
    });

    it('should pass row-data prop to ag-grid-vue', () => {
      wrapper = getWrapper();

      const agGrid = wrapper.findComponent(AgGridVue);
      const rowData = agGrid.props('rowData');

      expect(rowData).toBeDefined();
      expect(Array.isArray(rowData)).toBe(true);
    });

    it('should pass grid-options prop to ag-grid-vue', () => {
      wrapper = getWrapper();

      const agGrid = wrapper.findComponent(AgGridVue);
      const gridOptions = agGrid.props('gridOptions');

      expect(gridOptions).toBeDefined();
      expect(typeof gridOptions).toBe('object');
    });

    it('should pass grid-options with correct structure', () => {
      wrapper = getWrapper();

      const agGrid = wrapper.findComponent(AgGridVue);
      const gridOptions = agGrid.props('gridOptions');

      expect(gridOptions.treeData).toBe(true);
      expect(gridOptions.groupDefaultExpanded).toBe(-1);
      expect(gridOptions.domLayout).toBe('autoHeight');
      expect(gridOptions.pagination).toBe(false);
      expect(gridOptions.rowHeight).toBe(40);
      expect(gridOptions.headerHeight).toBe(45);
      expect(gridOptions.groupDisplayType).toBe('custom');
    });

    it('should pass grid-options with correct rowSelection configuration', () => {
      wrapper = getWrapper();

      const agGrid = wrapper.findComponent(AgGridVue);
      const gridOptions = agGrid.props('gridOptions');

      expect(gridOptions.rowSelection).toBeDefined();
      expect(gridOptions.rowSelection.mode).toBe('singleRow');
      expect(gridOptions.rowSelection.checkboxes).toBe(false);
    });

    it('should pass grid-options with localeText', () => {
      wrapper = getWrapper();

      const agGrid = wrapper.findComponent(AgGridVue);
      const gridOptions = agGrid.props('gridOptions');

      expect(gridOptions.localeText).toBeDefined();
      expect(gridOptions.localeText.noRowsToShow).toBe('Нет данных для отображения');
      expect(gridOptions.localeText.loadingOoo).toBe('Загрузка...');
    });

    it('should have getDataPath function in grid-options', () => {
      wrapper = getWrapper();

      const agGrid = wrapper.findComponent(AgGridVue);
      const gridOptions = agGrid.props('gridOptions');

      expect(gridOptions.getDataPath).toBeDefined();
      expect(typeof gridOptions.getDataPath).toBe('function');
    });
  });
});
