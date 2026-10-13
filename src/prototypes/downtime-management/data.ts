// ============ 停机管理原型 - 共享数据 ============

import dayjs from 'dayjs';

// 模拟数据的时间按“相对今天”动态生成，保证默认查询范围（前一天）内能查到数据
function recentDateTime(daysAgo: number, time: string): string {
    return `${dayjs().subtract(daysAgo, 'day').format('YYYY-MM-DD')} ${time}`;
}

export type MenuPageId =
    | 'reason-maintenance'
    | 'cause-entry'
    | 'downtime-analysis'
    | 'start-stop-config';

export type DcsFaultCategory = '工艺连锁停机' | '安全连锁停机' | '正常停机' | '其他';

// ============ 菜单配置 ============

export type MenuChild = {
    id: MenuPageId;
    title: string;
    summary: string;
};

export type MenuGroup = {
    key: string;
    title: string;
    icon: string;
    children: MenuChild[];
};

export const menuGroups: MenuGroup[] = [
    {
        key: 'downtime',
        title: '停机管理',
        icon: 'downtime',
        children: [
            { id: 'start-stop-config', title: '开停机配置', summary: '按工序/设备配置开机条件、停机条件及消息推送策略。' },
            { id: 'reason-maintenance', title: '停机原因维护', summary: '维护DCS定义的表面原因，将停机类型和子类型与DCS故障代码做映射。' },
            { id: 'cause-entry', title: '停机记录', summary: '按设备树录入停机记录的根本原因、停机类型。' },
            { id: 'downtime-analysis', title: '停机分析', summary: '按设备树展示停机记录明细、汇总、表面原因汇总、可靠性报告及帕累托分析。' },
        ],
    },
];

export const pageOrder: MenuPageId[] = [
    'start-stop-config',
    'reason-maintenance',
    'cause-entry',
    'downtime-analysis',
];

export const pageMeta: Record<MenuPageId, { title: string; group: string; summary: string }> = {
    'reason-maintenance': {
        title: '停机原因维护',
        group: '停机管理',
        summary: '维护DCS定义的表面原因，将停机类型和子类型与DCS故障代码做映射。',
    },
    'cause-entry': {
        title: '停机记录',
        group: '停机管理',
        summary: '按设备树录入停机记录的根本原因、停机类型。',
    },
    'downtime-analysis': {
        title: '停机分析',
        group: '停机管理',
        summary: '按设备树展示停机记录明细、汇总、表面原因汇总、可靠性报告及帕累托分析。',
    },
    'start-stop-config': {
        title: '开停机配置',
        group: '停机管理',
        summary: '按工序/设备配置开机条件、停机条件及消息推送策略。',
    },
};

// ============ 停机类型选项 ============

export const stopTypeOptions = [
    { value: '机械故障', label: '机械故障' },
    { value: '工艺故障', label: '工艺故障' },
    { value: '电气故障', label: '电气故障' },
    { value: '计划停机', label: '计划停机' },
    { value: '其他', label: '其他' },
    { value: '不计入', label: '不计入' },
];

export const subTypeOptions = [
    { value: '设备故障', label: '设备故障' },
    { value: '电气故障', label: '电气故障' },
    { value: '工艺故障', label: '工艺故障' },
    { value: '库满', label: '库满' },
    { value: '避峰用电', label: '避峰用电' },
    { value: '停电', label: '停电' },
    { value: '供水原因', label: '供水原因' },
    { value: '气候原因', label: '气候原因' },
    { value: '计划检修', label: '计划检修' },
];

// 根据停机类型过滤子类型
export function getSubTypeOptions(stopType: string) {
    if (stopType === '故障停机') {
        return subTypeOptions.filter((item) =>
            ['设备故障', '电气故障', '工艺故障'].includes(item.value)
        );
    }
    if (stopType === '计划停机') {
        return subTypeOptions.filter((item) =>
            ['库满', '避峰用电', '停电', '供水原因', '气候原因', '计划检修'].includes(item.value)
        );
    }
    // 不计入或未选择时无子类型
    return [];
}

// ============ DCS故障分类选项 ============

export const dcsFaultCategoryOptions: { value: DcsFaultCategory; label: string }[] = [
    { value: '工艺连锁停机', label: '工艺连锁停机' },
    { value: '安全连锁停机', label: '安全连锁停机' },
    { value: '正常停机', label: '正常停机' },
    { value: '其他', label: '其他' },
];

// ============ DCS表面原因维护数据 ============

export type DcsReasonRecord = {
    id: string;
    dcsFaultCategory: DcsFaultCategory;
    dcsReasonCode: string;
    dcsReasonDesc: string;
    stopType: string;
    subType: string;
};

export const initialDcsReasons: DcsReasonRecord[] = [
    { id: 'dcs-001', dcsFaultCategory: '工艺连锁停机', dcsReasonCode: '101', dcsReasonDesc: '回转窑停窑原因', stopType: '故障停机', subType: '设备故障' },
    { id: 'dcs-002', dcsFaultCategory: '正常停机', dcsReasonCode: '102', dcsReasonDesc: 'XX设备检修', stopType: '计划停机', subType: '计划检修' },
    { id: 'dcs-003', dcsFaultCategory: '正常停机', dcsReasonCode: '103', dcsReasonDesc: 'XX设备检修', stopType: '计划停机', subType: '计划检修' },
    { id: 'dcs-004', dcsFaultCategory: '其他', dcsReasonCode: '999', dcsReasonDesc: '罢工', stopType: '', subType: '' },
    { id: 'dcs-005', dcsFaultCategory: '工艺连锁停机', dcsReasonCode: '305', dcsReasonDesc: '上游设备故障', stopType: '故障停机', subType: '工艺故障' },
    { id: 'dcs-006', dcsFaultCategory: '工艺连锁停机', dcsReasonCode: '308', dcsReasonDesc: '外部电力故障', stopType: '故障停机', subType: '电气故障' },
    { id: 'dcs-007', dcsFaultCategory: '安全连锁停机', dcsReasonCode: '309', dcsReasonDesc: '停电', stopType: '故障停机', subType: '电气故障' },
    { id: 'dcs-008', dcsFaultCategory: '工艺连锁停机', dcsReasonCode: '331', dcsReasonDesc: '离心通风机备妥信号丢失', stopType: '故障停机', subType: '设备故障' },
    { id: 'dcs-009', dcsFaultCategory: '正常停机', dcsReasonCode: '332', dcsReasonDesc: '煤磨检修', stopType: '计划停机', subType: '计划检修' },
    { id: 'dcs-010', dcsFaultCategory: '正常停机', dcsReasonCode: '333', dcsReasonDesc: '库满', stopType: '计划停机', subType: '库满停' },
    { id: 'dcs-011', dcsFaultCategory: '正常停机', dcsReasonCode: '334', dcsReasonDesc: '临时暂停', stopType: '', subType: '' },
    { id: 'dcs-012', dcsFaultCategory: '工艺连锁停机', dcsReasonCode: '335', dcsReasonDesc: '熟料库满', stopType: '计划停机', subType: '库满停' },
    { id: 'dcs-013', dcsFaultCategory: '工艺连锁停机', dcsReasonCode: '336', dcsReasonDesc: '生料磨主电机过载', stopType: '故障停机', subType: '设备故障' },
    { id: 'dcs-014', dcsFaultCategory: '安全连锁停机', dcsReasonCode: '337', dcsReasonDesc: '冷却风机振动超标', stopType: '故障停机', subType: '设备故障' },
    { id: 'dcs-015', dcsFaultCategory: '工艺连锁停机', dcsReasonCode: '338', dcsReasonDesc: '原料喂料中断', stopType: '故障停机', subType: '工艺故障' },
    { id: 'dcs-016', dcsFaultCategory: '工艺连锁停机', dcsReasonCode: '339', dcsReasonDesc: '煤磨出口温度超标', stopType: '故障停机', subType: '工艺故障' },
];

// ============ 设备树数据 ============

export type ProcessNode = {
    title: string;
    key: string;
    processName: string;
    equipmentCode: string;
    isLeaf: boolean;
    parentKey?: string;
};

// 设备树结构（工序-设备层级）
export const equipmentTreeData = [
    {
        title: '石灰石破碎',
        key: 'process-crushing',
        children: [
            { title: '【361PR01】锤式破碎机(双驱)', key: 'eq-361PR01', isLeaf: true, processName: '矿山破碎', equipmentCode: '361PR01' },
            { title: '【362PR01】锤式破碎机(双驱)', key: 'eq-362PR01', isLeaf: true, processName: '矿山破碎', equipmentCode: '362PR01' },
            { title: '【363PR01】锤式破碎机(双驱)', key: 'eq-363PR01', isLeaf: true, processName: '矿山破碎', equipmentCode: '363PR01' },
        ],
    },
    {
        title: '1#生料磨',
        key: 'process-rawmill1',
        children: [
            { title: '【361RP01】辊压机', key: 'eq-361RP01', isLeaf: true, processName: '生料磨制', equipmentCode: '361RP01' },
            { title: '【361RP02】辊压机', key: 'eq-361RP02', isLeaf: true, processName: '生料磨制', equipmentCode: '361RP02' },
            { title: '【361RP03】辊压机', key: 'eq-361RP03', isLeaf: true, processName: '生料磨制', equipmentCode: '361RP03' },
        ],
    },
    {
        title: '2#生料磨',
        key: 'process-rawmill2',
        children: [
            { title: '【362RP01】辊压机', key: 'eq-362RP01', isLeaf: true, processName: '生料磨制', equipmentCode: '362RP01' },
            { title: '【362RP02】辊压机', key: 'eq-362RP02', isLeaf: true, processName: '生料磨制', equipmentCode: '362RP02' },
            { title: '【362RP03】辊压机', key: 'eq-362RP03', isLeaf: true, processName: '生料磨制', equipmentCode: '362RP03' },
        ],
    },
    {
        title: '回转窑',
        key: 'process-kiln',
        children: [
            { title: '【461KL01MT】窑主传动', key: 'eq-461KL01MT', isLeaf: true, processName: '熟料煅烧', equipmentCode: '461KL01MT' },
        ],
    },
    {
        title: '1#水泥磨',
        key: 'process-cementmill1',
        children: [
            { title: '【571BM01】球磨机', key: 'eq-571BM01', isLeaf: true, processName: '水泥粉磨', equipmentCode: '571BM01' },
            { title: '【571BM02】球磨机', key: 'eq-571BM02', isLeaf: true, processName: '水泥粉磨', equipmentCode: '571BM02' },
            { title: '【571BM03】球磨机', key: 'eq-571BM03', isLeaf: true, processName: '水泥粉磨', equipmentCode: '571BM03' },
        ],
    },
    {
        title: '2#水泥磨',
        key: 'process-cementmill2',
        children: [
            { title: '【572BM01】球磨机', key: 'eq-572BM01', isLeaf: true, processName: '水泥粉磨', equipmentCode: '572BM01' },
        ],
    },
];

// ============ 停机记录数据 ============

export type StopRecord = {
    id: string;
    processUnit: string;        // 产线单元
    equipmentName: string;      // 设备名称
    equipmentCode: string;     // 设备编码
    stopStartTime: string;      // 停机开始时间
    stopEndTime: string;        // 停机结束时间
    dcsFaultCategory: DcsFaultCategory | '';  // DCS故障分类（工序级停机记录为空）
    dcsReasonCode: string;      // DCS表面原因码
    dcsReasonDesc: string;      // DCS表面原因描述
    stopType: string;           // 停机类型（可编辑）
    subType: string;             // 子类型（可编辑）
    rootCause: string;          // 根本原因（可编辑）
    rootCauseFile: string;      // 根本原因附件文件名
    durationHours: number;      // 停机时长（小时）
    reporter: string;          // 填报人
    isProcessRecord?: boolean;  // 是否为工序级停机记录（设备下拉框锁定为禁用）
};

export const initialStopRecords: StopRecord[] = [
    { id: 'sr-p01', processUnit: '石灰石破碎', equipmentName: '', equipmentCode: '', stopStartTime: recentDateTime(1, '08:30:00'), stopEndTime: recentDateTime(1, '09:10:00'), dcsFaultCategory: '', dcsReasonCode: '', dcsReasonDesc: '', stopType: '工艺故障', subType: '工艺故障', rootCause: '工序整体联锁停机（未指定具体设备）', rootCauseFile: '', durationHours: 0.7, reporter: '林肖' },
    { id: 'sr-p02', processUnit: '石灰石破碎', equipmentName: '', equipmentCode: '', stopStartTime: recentDateTime(1, '14:00:00'), stopEndTime: recentDateTime(1, '15:00:00'), dcsFaultCategory: '', dcsReasonCode: '', dcsReasonDesc: '', stopType: '其他', subType: '', rootCause: '工序计划性临时暂停', rootCauseFile: '', durationHours: 1, reporter: '张圣' },
    { id: 'sr-001', processUnit: '矿山破碎', equipmentName: '锤式破碎机(双驱)', equipmentCode: '361PR01', isProcessRecord: true, stopStartTime: recentDateTime(1, '11:49:17'), stopEndTime: recentDateTime(1, '11:49:17'), dcsFaultCategory: '', dcsReasonCode: '', dcsReasonDesc: '', stopType: '机械故障', subType: '设备故障', rootCause: '上游皮带输送机电机过载导致连锁停机', rootCauseFile: '根本原因分析报告.docx', durationHours: 2, reporter: '林肖' },
    { id: 'sr-002', processUnit: '矿山破碎', equipmentName: '锤式破碎机(双驱)', equipmentCode: '361PR01', stopStartTime: recentDateTime(1, '11:49:17'), stopEndTime: recentDateTime(1, '11:49:17'), dcsFaultCategory: '工艺连锁停机', dcsReasonCode: '332', dcsReasonDesc: '煤磨检修', stopType: '机械故障', subType: '设备故障', rootCause: '煤磨系统计划检修期间联动停机', rootCauseFile: '', durationHours: 4, reporter: '肖建华' },
    { id: 'sr-003', processUnit: '矿山破碎', equipmentName: '锤式破碎机(双驱)', equipmentCode: '361PR01', stopStartTime: recentDateTime(1, '11:49:17'), stopEndTime: recentDateTime(1, '11:49:17'), dcsFaultCategory: '安全连锁停机', dcsReasonCode: '331', dcsReasonDesc: '离心通风机备妥信号丢失', stopType: '机械故障', subType: '设备故障', rootCause: '安全连锁回路信号故障', rootCauseFile: '安全连锁故障排查.docx', durationHours: 1, reporter: '任凯' },
    { id: 'sr-004', processUnit: '矿山破碎', equipmentName: '锤式破碎机(双驱)', equipmentCode: '361PR01', stopStartTime: recentDateTime(1, '11:49:17'), stopEndTime: recentDateTime(1, '11:49:17'), dcsFaultCategory: '正常停机', dcsReasonCode: '333', dcsReasonDesc: '库满', stopType: '不计入', subType: '', rootCause: '成品库满，临时暂停生产', rootCauseFile: '库满停机记录.docx', durationHours: 3, reporter: '李京' },
    { id: 'sr-005', processUnit: '矿山破碎', equipmentName: '锤式破碎机(双驱)', equipmentCode: '361PR01', stopStartTime: recentDateTime(1, '11:49:17'), stopEndTime: recentDateTime(1, '11:49:17'), dcsFaultCategory: '正常停机', dcsReasonCode: '334', dcsReasonDesc: '临时暂停', stopType: '其他', subType: '', rootCause: '生产调度临时安排暂停', rootCauseFile: '调度暂停记录.docx', durationHours: 1, reporter: '张圣' },
    { id: 'sr-006', processUnit: '生料磨制', equipmentName: '辊压机', equipmentCode: '361RP01', stopStartTime: recentDateTime(1, '12:30:00'), stopEndTime: recentDateTime(1, '13:30:00'), dcsFaultCategory: '工艺连锁停机', dcsReasonCode: '305', dcsReasonDesc: '外部电力故障', stopType: '工艺故障', subType: '工艺故障', rootCause: '外部电网波动导致工艺连锁停机', rootCauseFile: '电力故障分析.docx', durationHours: 1, reporter: '李祖江' },
    { id: 'sr-007', processUnit: '生料磨制', equipmentName: '辊压机', equipmentCode: '361RP01', stopStartTime: recentDateTime(1, '12:30:00'), stopEndTime: recentDateTime(1, '13:30:00'), dcsFaultCategory: '工艺连锁停机', dcsReasonCode: '308', dcsReasonDesc: '上游设备故障', stopType: '机械故障', subType: '设备故障', rootCause: '上游破碎机故障导致连锁停机', rootCauseFile: '上游故障报告.docx', durationHours: 1, reporter: '曹保元' },
    { id: 'sr-008', processUnit: '生料磨制', equipmentName: '辊压机', equipmentCode: '361RP01', stopStartTime: recentDateTime(1, '12:30:00'), stopEndTime: recentDateTime(1, '13:30:00'), dcsFaultCategory: '安全连锁停机', dcsReasonCode: '309', dcsReasonDesc: '停电', stopType: '电气故障', subType: '电气故障', rootCause: '供电系统突发停电', rootCauseFile: '停电事故报告.docx', durationHours: 1, reporter: '袁旺' },
    { id: 'sr-009', processUnit: '生料磨制', equipmentName: '辊压机', equipmentCode: '361RP01', stopStartTime: recentDateTime(1, '12:30:00'), stopEndTime: recentDateTime(1, '13:30:00'), dcsFaultCategory: '正常停机', dcsReasonCode: '332', dcsReasonDesc: '煤磨检修', stopType: '计划停机', subType: '计划检修', rootCause: '煤磨系统定期检修', rootCauseFile: '煤磨检修计划.docx', durationHours: 1, reporter: '张兆春' },
    { id: 'sr-010', processUnit: '生料磨制', equipmentName: '辊压机', equipmentCode: '361RP01', stopStartTime: recentDateTime(1, '12:30:00'), stopEndTime: recentDateTime(1, '13:30:00'), dcsFaultCategory: '正常停机', dcsReasonCode: '333', dcsReasonDesc: '库满', stopType: '计划停机', subType: '库满', rootCause: '生料库已满，暂停磨机运行', rootCauseFile: '生料库满记录.docx', durationHours: 1, reporter: '郭利强' },
    { id: 'sr-011', processUnit: '熟料煅烧', equipmentName: '窑主传动', equipmentCode: '461KL01MT', stopStartTime: recentDateTime(1, '12:30:00'), stopEndTime: recentDateTime(1, '13:30:00'), dcsFaultCategory: '工艺连锁停机', dcsReasonCode: '305', dcsReasonDesc: '外部电力故障', stopType: '工艺故障', subType: '工艺故障', rootCause: '窑主传动供电故障', rootCauseFile: '窑主传动故障.docx', durationHours: 2, reporter: '徐岩' },
    { id: 'sr-012', processUnit: '熟料煅烧', equipmentName: '窑主传动', equipmentCode: '461KL01MT', stopStartTime: recentDateTime(1, '12:30:00'), stopEndTime: recentDateTime(1, '13:30:00'), dcsFaultCategory: '安全连锁停机', dcsReasonCode: '337', dcsReasonDesc: '冷却风机振动超标', stopType: '机械故障', subType: '设备故障', rootCause: '冷却风机轴承磨损导致振动超标', rootCauseFile: '风机振动分析.docx', durationHours: 3, reporter: '林肖' },
    { id: 'sr-013', processUnit: '水泥粉磨', equipmentName: '球磨机', equipmentCode: '571BM01', stopStartTime: recentDateTime(1, '12:30:00'), stopEndTime: recentDateTime(1, '13:30:00'), dcsFaultCategory: '工艺连锁停机', dcsReasonCode: '336', dcsReasonDesc: '生料磨主电机过载', stopType: '机械故障', subType: '设备故障', rootCause: '球磨机主电机过载保护动作', rootCauseFile: '电机过载分析.docx', durationHours: 2, reporter: '肖建华' },
    { id: 'sr-014', processUnit: '水泥粉磨', equipmentName: '球磨机', equipmentCode: '571BM01', stopStartTime: recentDateTime(1, '12:30:00'), stopEndTime: recentDateTime(1, '13:30:00'), dcsFaultCategory: '正常停机', dcsReasonCode: '333', dcsReasonDesc: '库满', stopType: '计划停机', subType: '库满', rootCause: '水泥库满暂停粉磨', rootCauseFile: '水泥库满记录.docx', durationHours: 1, reporter: '任凯' },
    { id: 'sr-015', processUnit: '水泥粉磨', equipmentName: '球磨机', equipmentCode: '572BM01', stopStartTime: recentDateTime(1, '12:30:00'), stopEndTime: recentDateTime(1, '13:30:00'), dcsFaultCategory: '工艺连锁停机', dcsReasonCode: '339', dcsReasonDesc: '煤磨出口温度超标', stopType: '工艺故障', subType: '工艺故障', rootCause: '煤磨出口温度超限触发工艺连锁', rootCauseFile: '温度超标报告.docx', durationHours: 2, reporter: '李京' },
];

// ============ 可靠性报告数据 ============

export type ReliabilityReport = {
    name: string;
    formula: string;
    value: string | number;
};

export const reliabilityReports: ReliabilityReport[] = [
    { name: '运转率UF', formula: '运行小时数除以所选时间段内的小时数', value: '100%' },
    { name: '可靠性系数RF', formula: '运行小时数除以理论小时数（运转小时数+故障停机小时数）', value: 0.95 },
    { name: '机电可靠性系数RF', formula: '运行小时数除以理论小时数（运转小时数+设备故障停机小时数+电气故障停机小时数）', value: 0.95 },
    { name: '无停机连续运转日(天)NCOD', formula: '在时间段内没有任何类型的停机且连续运转最长的天数', value: 30 },
    { name: '故障停机次数NSFI', formula: '在时间段内总的故障停机次数', value: 10 },
    { name: '平均故障间隔时间(小时)MTBF', formula: '运转小时数除以故障停机次数', value: 48 },
    { name: '故障停机累计时间(小时)CHSI', formula: '停机类型为故障停机累计小时数', value: 36 },
    { name: '故障停机日平均时间(小时)DHSI', formula: '可靠性系数RF*24', value: 12 },
];

// ============ 时间范围选项 ============

export const timeRangeOptions = [
    { value: 'yesterday', label: '昨日' },
    { value: 'week', label: '近1周' },
    { value: 'month', label: '近1月' },
    { value: 'quarter', label: '近3月' },
    { value: 'year', label: '近1年' },
    { value: 'custom', label: '自定义' },
];

// ============ 分析Tab选项 ============

export const analysisTabs = [
    { key: 'statistics', label: '停机统计' },
    { key: 'cause-summary', label: '表面原因汇总' },
    { key: 'reliability', label: '可靠性报告' },
    { key: 'pareto', label: '帕累托分析' },
];

// ============ 工具函数 ============

// 根据设备编码获取停机记录
export function getStopRecordsByEquipment(equipmentCode: string): StopRecord[] {
    return initialStopRecords.filter((r) => r.equipmentCode === equipmentCode);
}

// 根据工序key获取其下所有设备的停机记录
export function getStopRecordsByProcess(processKey: string): StopRecord[] {
    const process = equipmentTreeData.find((p) => p.key === processKey);
    if (!process || !process.children) return [];
    const codes = process.children.map((c: any) => c.equipmentCode);
    return initialStopRecords.filter((r) => codes.includes(r.equipmentCode));
}

// 根据设备编码获取设备信息
export function getEquipmentInfo(equipmentCode: string) {
    for (const proc of equipmentTreeData) {
        const child = (proc.children as any[]).find((c) => c.equipmentCode === equipmentCode);
        if (child) {
            return { processName: proc.title, equipmentName: child.title.split('【')[0], equipmentCode, fullTitle: child.title };
        }
    }
    return null;
}

// 根据工序key获取工序信息
export function getProcessInfo(processKey: string) {
    const proc = equipmentTreeData.find((p) => p.key === processKey);
    if (!proc) return null;
    return { processName: proc.title, processKey };
}

// ============ 开停机配置数据 ============

// 条件类型
export type ConditionType = 'parameter' | 'signal' | 'time' | 'manual';

// 条件逻辑关系
export type ConditionLogic = 'AND' | 'OR';

// 开停机条件
export type StartStopCondition = {
    id: string;
    type: ConditionType;       // 条件类型：参数判断/信号状态/时间条件/人工确认
    param: string;             // 参数/信号名称
    customCode?: string;       // 自定义编码（选择变量后自动带出）
    operator: string;          // 运算符：>、<、=、>=、<=、≠ 等
    threshold: string;         // 阈值
    logic: ConditionLogic;     // 与上一条件的逻辑关系（AND/OR）
    delaySec: number;          // 延迟秒数（满足条件后需持续多久才触发）
    description?: string;      // 备注
};

// 消息推送策略
export type PushPolicy = {
    id: string;
    event: 'start' | 'stop' | 'faultStop';   // 触发事件：开机/停机/故障停机
    template: string;          // 消息模板（引用消息中心已配置的模板）
    recipients?: string[];     // 推送人员（由模板配置）
    channels?: string[];       // 推送渠道（由模板配置）
    delayedMin?: number;       // 延迟推送分钟数（由模板配置）
};

// 节点配置
export type NodeConfig = {
    nodeKey: string;            // 对应树节点 key
    nodeTitle: string;          // 节点标题
    isProcess: boolean;        // 是否为工序节点（非叶子）
    startConditions: StartStopCondition[];
    stopConditions: StartStopCondition[];
    pushPolicies: PushPolicy[];
    startLogicMode?: 'AND' | 'OR';  // 开机条件逻辑模式
    stopLogicMode?: 'AND' | 'OR';   // 停机条件逻辑模式
    isPrimaryEquipment?: boolean;   // 是否为工序运行设备（同工序下唯一）
    stopReasonParam?: string;       // 停机原因（选择一个参数/变量）
    stopReasonCustomCode?: string;  // 停机原因自定义编码
    faultPointParam?: string;       // 故障点位（选择一个参数/变量）
    faultPointCustomCode?: string;  // 故障点位自定义编码
    byHostDevice?: boolean;         // 工序节点：是否按主机设备配置
    hostDeviceKey?: string;         // 工序节点：按主机设备配置时选中的设备 key
};

// 条件类型选项
export const conditionTypeOptions = [
    { value: 'parameter', label: '参数判断' },
    { value: 'signal', label: '信号状态' },
    { value: 'time', label: '时间条件' },
    { value: 'manual', label: '人工确认' },
];

// 运算符选项
export const operatorOptions = [
    { value: '>', label: '>' },
    { value: '<', label: '<' },
    { value: '=', label: '=' },
    { value: '>=', label: '>=' },
    { value: '<=', label: '<=' },
    { value: '≠', label: '≠' },
];

// 逻辑关系选项
export const logicOptions = [
    { value: 'AND', label: '且 (AND)' },
    { value: 'OR', label: '或 (OR)' },
];

// 推送渠道选项
export const pushChannelOptions = [
    { value: '企业微信', label: '企业微信' },
    { value: '短信', label: '短信' },
    { value: '邮件', label: '邮件' },
    { value: 'APP', label: 'APP' },
];

// 常用参数/信号列表（供选择）
export const commonParamOptions = [
    { value: '主电机电流', label: '主电机电流' },
    { value: '轴承温度', label: '轴承温度' },
    { value: '振动速度', label: '振动速度' },
    { value: '出口温度', label: '出口温度' },
    { value: '入口压力', label: '入口压力' },
    { value: '料位高度', label: '料位高度' },
    { value: '运行信号', label: '运行信号' },
    { value: '备妥信号', label: '备妥信号' },
    { value: '连锁信号', label: '连锁信号' },
    { value: '故障信号', label: '故障信号' },
];

// 测点变量（供变量选择弹窗使用）
export type MeasurePoint = {
    id: string;
    name: string;           // 测点名称
    code: string;           // 测点编码
    customCode: string;     // 自定义编码
    type: string;           // 测点类型
    mainEquipment: string;  // 主设备
    workshop: string;       // 车间工段
};

export const measurePointList: MeasurePoint[] = [
    { id: 'mp-001', name: '原料磨高压进线柜二', code: '41MV1P01AER', customCode: 'AILine141MV1P01AER01', type: '计量', mainEquipment: '', workshop: '一线原料' },
    { id: 'mp-002', name: '窑主传变压器', code: '41MV1P03AER', customCode: 'AILine141MV1P03AER01', type: '计量', mainEquipment: '', workshop: '一线原料' },
    { id: 'mp-003', name: '原料磨主电机', code: '41MV1P04AER', customCode: 'AILine141MV1P04AER01', type: '计量', mainEquipment: '', workshop: '一线原料' },
    { id: 'mp-004', name: '窑尾电气室变压器', code: '41MV1P05AER', customCode: 'AILine141MV1P05AER01', type: '计量', mainEquipment: '', workshop: '一线原料' },
    { id: 'mp-005', name: '原料磨电气室变压器', code: '41MV1P06AER', customCode: 'AILine141MV1P06AER01', type: '计量', mainEquipment: '', workshop: '一线原料' },
    { id: 'mp-006', name: '备用', code: '41MV1P07AER', customCode: 'AILine141MV1P07AER01', type: '计量', mainEquipment: '', workshop: '一线原料' },
    { id: 'mp-007', name: '石灰石破碎', code: '41MV1P08AER', customCode: 'AILine141MV1P08AER01', type: '计量', mainEquipment: '', workshop: '一线原料' },
    { id: 'mp-008', name: '母线联络', code: '41MV1P09AER', customCode: 'AILine141MV1P09AER01', type: '计量', mainEquipment: '', workshop: '一线原料' },
    { id: 'mp-009', name: '辊压机运行', code: '361RP01RUN', customCode: 'AILine1361RP01RUN01', type: '状态', mainEquipment: '辊压机', workshop: '一线原料' },
    { id: 'mp-010', name: '破碎机主电机电流', code: '361PR01CUR', customCode: 'AILine1361PR01CUR01', type: '计量', mainEquipment: '锤式破碎机', workshop: '一线原料' },
    { id: 'mp-011', name: '窑主传动电流', code: '461KL01MTI', customCode: 'AILine1461KL01MTI01', type: '计量', mainEquipment: '窑主传动', workshop: '一线烧成' },
    { id: 'mp-012', name: '生料磨出口温度', code: '361RP01T', customCode: 'AILine1361RP01T001', type: '计量', mainEquipment: '辊压机', workshop: '一线原料' },
];

// 值班人清单（供填报人选择，人员选择弹窗组织树同源）
export const reporterOptions = [
    { value: '林肖', label: '林肖·13800138001' },
    { value: '肖建华', label: '肖建华·13900139002' },
    { value: '任凯', label: '任凯·13700137003' },
    { value: '李京', label: '李京·13600136004' },
    { value: '张圣', label: '张圣·13500135005' },
    { value: '李祖江', label: '李祖江·13400134006' },
    { value: '曹保元', label: '曹保元·13300133007' },
    { value: '袁旺', label: '袁旺·13200132008' },
    { value: '张兆春', label: '张兆春·13100131009' },
    { value: '郭利强', label: '郭利强·13000130010' },
    { value: '徐岩', label: '徐岩·13800138011' },
];

// 人员列表（供推送选择）
export const recipientOptions = [
    { value: '张明', label: '张明·13800138001' },
    { value: '李伟', label: '李伟·13900139002' },
    { value: '王强', label: '王强·13700137003' },
    { value: '陈刚', label: '陈刚·13600136004' },
    { value: '赵斌', label: '赵斌·13500135005' },
    { value: '刘洋', label: '刘洋·13400134006' },
    { value: '调度中心', label: '调度中心·调度班' },
    { value: '设备科', label: '设备科·设备组' },
];

// 消息模板选项（来自消息中心已配置的模板）
export const messageTemplateOptions = [
    { value: 'tpl-start-notify', label: '设备开机通知 - {设备}已开机，请关注运行状态。' },
    { value: 'tpl-stop-notify', label: '设备停机通知 - {设备}已停机，请及时排查原因。' },
    { value: 'tpl-fault-alarm', label: '设备故障告警 - {设备}发生故障，请立即处理。' },
    { value: 'tpl-maint-remind', label: '设备维保提醒 - {设备}即将到达维保周期，请安排维保。' },
];

// 示例：石灰石破碎工段的开停机配置
export const sampleNodeConfigs: NodeConfig[] = [
    {
        nodeKey: 'process-crushing',
        nodeTitle: '石灰石破碎',
        isProcess: true,
        startConditions: [
            { id: 'sc-001', type: 'signal', param: '备妥信号', operator: '=', threshold: '1', logic: 'AND', delaySec: 0, description: '破碎机备妥' },
            { id: 'sc-002', type: 'signal', param: '连锁信号', operator: '=', threshold: '1', logic: 'AND', delaySec: 0, description: '连锁回路正常' },
            { id: 'sc-003', type: 'parameter', param: '主电机电流', operator: '<', threshold: '120A', logic: 'AND', delaySec: 10, description: '启动电流限制' },
        ],
        stopConditions: [
            { id: 'tc-001', type: 'signal', param: '故障信号', operator: '=', threshold: '1', logic: 'OR', delaySec: 0, description: '设备故障触发停机' },
            { id: 'tc-002', type: 'parameter', param: '轴承温度', operator: '>', threshold: '85°C', logic: 'OR', delaySec: 30, description: '轴承温度超标' },
            { id: 'tc-003', type: 'parameter', param: '振动速度', operator: '>', threshold: '7.1mm/s', logic: 'OR', delaySec: 30, description: '振动超标' },
            { id: 'tc-004', type: 'manual', param: '人工确认', operator: '=', threshold: '停机', logic: 'OR', delaySec: 0, description: '调度手动停机' },
        ],
        pushPolicies: [
            { id: 'pp-001', event: 'start', template: 'tpl-start-notify' },
            { id: 'pp-002', event: 'stop', template: 'tpl-stop-notify' },
        ],
    },
];
