import { action } from '@storybook/addon-actions';
import infoTable from './index.vue';

export default {
  title: '组件/表格/InfoTable',
  component: infoTable, // 传递后会自动解析组件参数
};

const Template = (args, { argTypes }) => ({
  components: { infoTable },
  props: Object.keys(argTypes),
  template: `
      <div style="padding: 20px;">
        <info-table @btn-click="btnClickFunc" :title="title" :infoList="infoList" />
      </div>
    `,
  methods: {
    btnClickFunc: action('btn-click'),
  },
});

const mockItems = [
  {
    title: '车辆VIN码',
    value: 'LB1WA5884A8008781',
  },
  {
    title: '表显里程（公里）',
    value: '2832566',
  },
  {
    title: '排量（L）',
    value: '3.982',
  },
  {
    title: '排放标准',
    value: '低于国一',
  },
];

export const 基本用法 = Template.bind({});
基本用法.args = {
  title: '基本信息',
  infoList: [
    {
      subTitle: '子标题1',
      items: [...mockItems],
    },
  ],
};

export const 没有子标题 = Template.bind({});
没有子标题.args = {
  title: '基本信息',
  infoList: [
    {
      items: [...mockItems],
    },
  ],
};

export const 子项自定义slot = (args, { argTypes }) => ({
  components: { infoTable },
  props: Object.keys(argTypes),
  template: `
    <div style="padding: 20px;">
      <info-table :title="title" :infoList="infoList">
        <span slot="custom-1">子项自定义slot内容</span>
      </info-table>
    </div>
  `,
});
子项自定义slot.args = {
  title: '子项自定义slot',
  infoList: [
    {
      items: [
        {
          slotName: 'custom-1',
          title: '车辆VIN码',
          value: 'LB1WA5884A8008781',
        },
        {
          title: '表显里程（公里）',
          value: '2832566',
        },
      ],
    },
  ],
};

export const 子项有按钮 = Template.bind({});
子项有按钮.args = {
  title: '子项有按钮',
  infoList: [
    {
      items: [...mockItems.map((item, index) => ({ ...item, btnText: `按钮${index}`, btnInfo: index }))],
    },
  ],
};
