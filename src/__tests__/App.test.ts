import { describe, it, expect, afterEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import App from '../App.vue';
import TreeGrid from '@/components/TreeGrid.vue';
import itemsJson from '@/mocks/items.json';

describe('App', () => {
  let wrapper: any = null;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  const getWrapper = () => shallowMount(App);

  it('should render TreeGrid component', () => {
    wrapper = getWrapper();

    const treeGrid = wrapper.findComponent(TreeGrid);

    expect(treeGrid.exists()).toBe(true);
  });

  it('should pass items from items.json to TreeGrid component', () => {
    wrapper = getWrapper();

    const treeGrid = wrapper.findComponent(TreeGrid);

    expect(treeGrid.props('items')).toEqual(itemsJson);
  });
});
