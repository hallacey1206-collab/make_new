// ============ 实时监测原型 - 共享数据 ============

// ============ 1. DCS 在线监视图数据 ============

// 左侧功能菜单（工艺流程分组）
export interface MenuGroup {
    key: string;
    title: string;
    children: { key: string; label: string; }[];
}

export const dcsMenuData: MenuGroup[] = [
    {
        key: 'dcs',
        title: 'DCS操作画面',
        children: [
            { key: 'lime-crush', label: '石灰石破碎' },
            { key: 'aux-crush', label: '辅料破碎' },
            { key: 'raw-blend', label: '原料调配' },
            { key: 'raw-mill', label: '原料磨' },
            { key: 'raw-mill-hydraulic', label: '原料磨液压站' },
            { key: 'raw-silo', label: '生料库' },
            { key: 'exhaust', label: '废气处理' },
            { key: 'kiln', label: '窑' },
            { key: 'kiln-head', label: '窑头' },
            { key: 'clinker-silo', label: '熟料库' },
            { key: 'cement-mill-a', label: '水泥A磨' },
            { key: 'cement-mill-a-hyd', label: '水泥A磨液压站' },
            { key: 'cement-mill-b', label: '水泥B磨' },
            { key: 'cement-mill-b-hyd', label: '水泥B磨液压站' },
            { key: 'cement-silo', label: '水泥库' },
            { key: 'packing', label: '包装' },
            { key: 'kiln-tail-oil-1', label: '窑尾喷油1' },
            { key: 'kiln-tail-oil-2', label: '窑尾喷油2' },
            { key: 'kiln-head-oil', label: '窑头喷油' },
            { key: 'heavy-oil', label: '重油' },
            { key: 'water', label: '水系统' },
            { key: 'dc-power', label: '直流电源' },
            { key: 'emergency', label: '应急设备' },
            { key: 'dcs-kiln-report', label: 'DCS烧成报表' },
            { key: 'dcs-mill-report', label: 'DCS磨机报表' },
        ],
    },
];

// 主区左侧垂直工序切换按钮
export const processShortcuts = [
    { key: 'AdditiveMeal', label: 'AdditiveMeal' },
    { key: 'RMProportion', label: 'RMProportion' },
    { key: 'Raw Mill', label: 'Raw Mill' },
    { key: 'Exhuast', label: 'Exhuast' },
    { key: 'Kiln', label: 'Kiln' },
    { key: 'KLOU', label: 'KLOU' },
    { key: 'Clinker Silo', label: 'Clinker Silo' },
    { key: 'Cement Mill A', label: 'Cement Mill A' },
    { key: 'Cement Mill B', label: 'Cement Mill B' },
    { key: 'Cement Silo', label: 'Cement Silo' },
    { key: 'Cement Pack', label: 'Cement Pack' },
];

// 测点数据（可点击跳转趋势页）
export interface MonitorPoint {
    id: string;          // 测点编号（趋势页关联用）
    tag: string;         // 位号
    value: string;       // 显示值
    unit: string;        // 单位
}

export const limestoneYardPoints: MonitorPoint[] = [
    { id: 'AO3511FR', tag: '02.011', value: '0.0', unit: 'A' },
    { id: 'AI0204M11Z1R', tag: '02.012', value: '0.0', unit: 'A' },
];

export const conveyingPoints: MonitorPoint[] = [
    { id: 'AI0204A', tag: '02.04a', value: '0.3', unit: 'A' },
];

export const beltPoints: MonitorPoint[] = [
    { id: 'AI0205', tag: '02.05', value: '58.9', unit: 'A' },
    { id: 'AI0206', tag: '02.06', value: '100.9', unit: 'A' },
    { id: 'AI0206F', tag: '02.06', value: '0.0', unit: 't/h' },
    { id: 'AI0207', tag: '02.07', value: '65.2', unit: 'A' },
    { id: 'AI2208', tag: '22.08', value: '126.1', unit: 'A' },
];

// 设备运行状态
export type DeviceStatus = 'running' | 'stopped' | 'delay' | 'material';

export interface DeviceStatusBlock {
    name: string;
    lines: { status: DeviceStatus; text: string; }[];
}

export const stackerStatus: DeviceStatusBlock = {
    name: 'Stacker',
    lines: [
        { status: 'stopped', text: 'Yard full' },
        { status: 'running', text: 'normal operations' },
    ],
};

export const reclaimerStatus: DeviceStatusBlock = {
    name: 'Reclaimer',
    lines: [
        { status: 'delay', text: 'STOP DELAY' },
        { status: 'running', text: 'normal operations' },
    ],
};

// ============ 2. 测点趋势页数据 ============

// 趋势页测点定义
export interface TrendTag {
    id: string;          // 测点名
    desc: string;        // 测点描述
    color: string;       // 折线颜色
    unit: string;
    currentValue: number;
    currentTime: string;
    minTime: string;
    minValue: number;
    maxTime: string;
    maxValue: number;
}

export const trendTags: TrendTag[] = [
    {
        id: 'AO3511FR',
        desc: 'Belt Frequency Set',
        color: '#1677ff',
        unit: '',
        currentValue: 15,
        currentTime: '2026-09-10 21:20:40',
        minTime: '2026-09-09 21:24:28',
        minValue: 15,
        maxTime: '2026-09-09 21:24:28',
        maxValue: 15,
    },
    {
        id: 'AI0204M11Z1R',
        desc: 'crusher motor1 Current',
        color: '#95de64',
        unit: 'A',
        currentValue: 15.88,
        currentTime: '2026-09-10 21:20:40',
        minTime: '2026-09-09 22:59:04',
        minValue: 0.0527,
        maxTime: '2026-09-10 13:04:44',
        maxValue: 36.69,
    },
    {
        id: 'RMZFK',
        desc: '',
        color: '#237804',
        unit: '',
        currentValue: 430.79,
        currentTime: '2026-09-10 21:20:40',
        minTime: '2026-09-10 06:14:48',
        minValue: 413.9,
        maxTime: '2026-09-09 21:33:04',
        maxValue: 445.85,
    },
    {
        id: 'AOAP2204',
        desc: 'stacker Angular position',
        color: '#fadb14',
        unit: '°',
        currentValue: 30.5,
        currentTime: '2026-09-10 21:20:40',
        minTime: '2026-09-10 02:10:12',
        minValue: 28.6,
        maxTime: '2026-09-10 15:42:30',
        maxValue: 61.4,
    },
];

// 时间跨度选项（小时）
export const spanOptions = [
    { label: '1小时', value: 1 },
    { label: '2小时', value: 2 },
    { label: '8小时', value: 8 },
    { label: '24小时', value: 24 },
];
