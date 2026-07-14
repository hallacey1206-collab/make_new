import React, { useState, useEffect } from 'react';
import {
    Drawer, Form, Input, Select, TreeSelect, Radio, Checkbox, Switch, InputNumber,
    Button, Space, Collapse, Card, Row, Col, message, Tag, Tabs, Table, Cascader,
} from 'antd';
import { Plus, Trash2, ArrowUp, ArrowDown, ChevronDown, ChevronRight } from 'lucide-react';

const { Panel } = Collapse;
const { TextArea } = Input;

// ============ 常量数据 ============

export const BIZ_OBJECTS = [
    { value: 'maintenance', label: '维修工单', timings: ['create_before', 'create_after', 'edit_before', 'edit_after', 'deleted', 'withdrawn', 'approved', 'rejected', 'status_changed', 'field_changed', 'scheduled'] },
    { value: 'quality', label: '质量检验单', timings: ['create_before', 'create_after', 'edit_before', 'edit_after', 'deleted', 'approved', 'rejected', 'field_changed'] },
    { value: 'todo', label: '待办事项', timings: ['create_before', 'create_after', 'edit_before', 'edit_after', 'deleted', 'completed', 'field_changed'] },
    { value: 'production', label: '生产批次', timings: ['create_before', 'create_after', 'edit_before', 'edit_after', 'deleted', 'status_changed', 'field_changed'] },
    { value: 'inventory', label: '库存记录', timings: ['create_before', 'create_after', 'edit_before', 'edit_after', 'deleted', 'status_changed', 'field_changed', 'scheduled'] },
];

// 业务对象字段定义（用于字段变更级联选择）
export const BIZ_OBJECT_FIELDS: Record<string, { value: string; label: string; children?: { value: string; label: string }[] }[]> = {
    maintenance: [
        { value: 'status', label: '工单状态', children: [{ value: 'draft', label: '草稿' }, { value: 'pending', label: '审批中' }, { value: 'approved', label: '已同意' }, { value: 'rejected', label: '已驳回' }, { value: 'completed', label: '已完成' }] },
        { value: 'priority', label: '优先级', children: [{ value: 'urgent', label: '紧急' }, { value: 'normal', label: '一般' }, { value: 'low', label: '低' }] },
        { value: 'device.line', label: '设备产线' },
        { value: 'assignee', label: '负责人' },
        { value: 'dueDate', label: '截止日期' },
    ],
    material: [
        { value: 'status', label: '申请状态', children: [{ value: 'draft', label: '草稿' }, { value: 'pending', label: '审批中' }, { value: 'approved', label: '已同意' }] },
        { value: 'materialType', label: '物料类型' },
        { value: 'quantity', label: '数量' },
        { value: 'urgency', label: '紧急程度' },
    ],
    quality: [
        { value: 'status', label: '检验状态', children: [{ value: 'pending', label: '待检验' }, { value: 'qualified', label: '合格' }, { value: 'unqualified', label: '不合格' }] },
        { value: 'inspector', label: '检验人' },
        { value: 'result', label: '检验结果' },
    ],
    todo: [
        { value: 'status', label: '任务状态', children: [{ value: 'pending', label: '待处理' }, { value: 'in_progress', label: '进行中' }, { value: 'completed', label: '已完成' }] },
        { value: 'assignee', label: '执行人' },
        { value: 'dueDate', label: '截止日期' },
    ],
    production: [
        { value: 'status', label: '批次状态', children: [{ value: 'planned', label: '计划中' }, { value: 'producing', label: '生产中' }, { value: 'completed', label: '已完成' }] },
        { value: 'quantity', label: '数量' },
        { value: 'productLine', label: '产线' },
    ],
    inventory: [
        { value: 'status', label: '库存状态', children: [{ value: 'normal', label: '正常' }, { value: 'low', label: '库存不足' }, { value: 'overstock', label: '积压' }] },
        { value: 'quantity', label: '数量' },
        { value: 'warehouse', label: '仓库' },
    ],
};

// 关联字段定义
export const RELATED_FIELDS: { value: string; label: string; children: { value: string; label: string }[] }[] = [
    { value: 'related_device', label: '关联设备', children: [{ value: 'device.status', label: '设备状态' }, { value: 'device.health', label: '健康度' }] },
    { value: 'related_org', label: '关联组织', children: [{ value: 'org.name', label: '组织名称' }, { value: 'org.type', label: '组织类型' }] },
];

export const TIMING_LABELS: Record<string, string> = {
    create_before: '创建前',
    create_after: '创建后',
    edit_before: '编辑前',
    edit_after: '编辑后',
    deleted: '被删除',
    withdrawn: '被撤回',
    approved: '审批通过',
    rejected: '审批驳回',
    status_changed: '状态变更',
    scheduled: '定时触发',
    completed: '完成时',
    field_changed: '字段变更',
};

const SCHEDULE_UNITS: { value: string; label: string }[] = [
    { value: 'hour', label: '小时' },
    { value: 'day', label: '天' },
    { value: 'month', label: '月' },
    { value: 'year', label: '年' },
];

export const SCHEDULE_UNIT_LABELS: Record<string, string> = Object.fromEntries(
    SCHEDULE_UNITS.map((o) => [o.value, o.label]),
);

export function formatScheduleDisplay(s: ScheduleConfig | undefined): string {
    if (!s) return '';
    const unitLabel = SCHEDULE_UNIT_LABELS[s.unit] || s.unit;
    let result = `每${s.interval}${unitLabel}`;
    // 月 — 仅年时显示
    if (s.unit === 'year' && s.month != null) result += ` · ${s.month}月`;
    // 日 — 月或年时显示
    if ((s.unit === 'month' || s.unit === 'year') && s.day != null) result += ` · ${s.day}日`;
    // 时 — 非小时时显示
    if (s.unit !== 'hour') result += ` · ${String(s.hour).padStart(2, '0')}时`;
    // 分 — 始终显示
    result += ` · ${String(s.minute).padStart(2, '0')}分`;
    return result;
}

const FIELD_OPTIONS: Record<string, { value: string; label: string }[]> = {
    maintenance: [
        { value: 'status', label: '状态' },
        { value: 'priority', label: '优先级' },
        { value: 'device.line', label: '设备.产线' },
        { value: 'device.name', label: '设备.名称' },
        { value: 'type', label: '专业类型' },
        { value: 'createTime', label: '创建时间' },
    ],
    quality: [
        { value: 'result', label: '检验结果' },
        { value: 'item', label: '检验项' },
        { value: 'value', label: '检验值' },
        { value: 'standard', label: '标准值' },
        { value: 'status', label: '状态' },
    ],
    todo: [
        { value: 'status', label: '状态' },
        { value: 'urgency', label: '紧急程度' },
        { value: 'category', label: '分类' },
    ],
    production: [
        { value: 'batchNo', label: '批次号' },
        { value: 'product', label: '产品' },
        { value: 'quantity', label: '产量' },
        { value: 'status', label: '状态' },
    ],
    inventory: [
        { value: 'material', label: '物料' },
        { value: 'quantity', label: '数量' },
        { value: 'location', label: '库位' },
        { value: 'ratio', label: '库位比例' },
    ],
};

const OPERATORS = [
    { value: 'eq', label: '等于' },
    { value: 'ne', label: '不等于' },
    { value: 'gt', label: '大于' },
    { value: 'lt', label: '小于' },
    { value: 'gte', label: '大于等于' },
    { value: 'lte', label: '小于等于' },
    { value: 'contains', label: '包含' },
    { value: 'not_contains', label: '不包含' },
    { value: 'starts_with', label: '以...开头' },
    { value: 'ends_with', label: '以...结尾' },
    { value: 'is_empty', label: '为空' },
    { value: 'not_empty', label: '不为空' },
];

const VALUE_TYPES = [
    { value: 'fixed', label: '固定值' },
    { value: 'user_attr', label: '用户属性' },
    { value: 'system_var', label: '系统变量' },
    { value: 'expression', label: '表达式' },
];

const ACTION_TYPES = [
    { value: 'set_field', label: '设置字段值' },
    { value: 'send_notification', label: '发送通知' },
    { value: 'start_approval', label: '启动审批流' },
    { value: 'call_api', label: '调用API' },
    { value: 'create_task', label: '生成任务' },
    { value: 'update_related', label: '更新关联数据' },
];

const ORG_TREE = [
    {
        value: 'DCC水泥厂',
        title: 'DCC水泥厂',
        fullTitle: 'DCC水泥厂',
        children: [
            { value: 'DCC水泥厂/生产部', title: '生产部', fullTitle: 'DCC水泥厂/生产部' },
            { value: 'DCC水泥厂/质量部', title: '质量部', fullTitle: 'DCC水泥厂/质量部' },
            { value: 'DCC水泥厂/设备部', title: '设备部', fullTitle: 'DCC水泥厂/设备部' },
        ],
    },
    {
        value: '伊拉克区域',
        title: '伊拉克区域',
        fullTitle: '伊拉克区域',
        children: [
            { value: '伊拉克区域/卡尔巴拉厂', title: '卡尔巴拉厂', fullTitle: '伊拉克区域/卡尔巴拉厂' },
            { value: '伊拉克区域/巴比伦厂', title: '巴比伦厂', fullTitle: '伊拉克区域/巴比伦厂' },
        ],
    },
    {
        value: '东南亚区域',
        title: '东南亚区域',
        fullTitle: '东南亚区域',
        children: [
            { value: '东南亚区域/越南厂', title: '越南厂', fullTitle: '东南亚区域/越南厂' },
            { value: '东南亚区域/印尼厂', title: '印尼厂', fullTitle: '东南亚区域/印尼厂' },
        ],
    },
];

const LINE_TREE = [
    {
        value: '一线',
        title: '一线',
        fullTitle: '一线',
        children: [
            { value: '一线/生料工段', title: '生料工段', fullTitle: '一线/生料工段' },
            { value: '一线/烧成工段', title: '烧成工段', fullTitle: '一线/烧成工段' },
            { value: '一线/水泥磨工段', title: '水泥磨工段', fullTitle: '一线/水泥磨工段' },
        ],
    },
    {
        value: '二线',
        title: '二线',
        fullTitle: '二线',
        children: [
            { value: '二线/生料工段', title: '生料工段', fullTitle: '二线/生料工段' },
            { value: '二线/烧成工段', title: '烧成工段', fullTitle: '二线/烧成工段' },
            { value: '二线/水泥磨工段', title: '水泥磨工段', fullTitle: '二线/水泥磨工段' },
        ],
    },
    {
        value: '三线',
        title: '三线',
        fullTitle: '三线',
        children: [
            { value: '三线/生料工段', title: '生料工段', fullTitle: '三线/生料工段' },
            { value: '三线/烧成工段', title: '烧成工段', fullTitle: '三线/烧成工段' },
            { value: '三线/水泥磨工段', title: '水泥磨工段', fullTitle: '三线/水泥磨工段' },
        ],
    },
];

// ============ 类型定义 ============

export interface ConditionItem {
    id: string;
    field: string;
    operator: string;
    valueType: string;
    value: any;
}

export interface ConditionGroup {
    id: string;
    logic: 'AND' | 'OR';
    conditions: ConditionItem[];
}

export interface ActionItem {
    id: string;
    type: string;
    params: Record<string, any>;
    condition?: ConditionGroup;
}

export interface ScheduleConfig {
    interval: number;
    unit: 'hour' | 'day' | 'month' | 'year';
    hour: number;
    minute: number;
    day?: number;
    month?: number;
}

// ============ 按钮权限矩阵类型 ============

export interface ButtonPermRow {
    id: string;
    bizObject: string;
    status: string;
    identityGroup: string;
    detailButtons: string[];
    listButtons: string[];
}

export interface ButtonPermGroup {
    bizObject: string;
    rows: ButtonPermRow[];
}

/** 每个业务对象可配置的按钮选项（static 用于角色管理，dynamic 用于按钮权限矩阵） */
export const BIZ_OBJECT_BUTTONS: Record<string, {
    static: { value: string; label: string }[];
    dynamic: { value: string; label: string }[];
    /** 兼容：detail 列出所有按钮（static + dynamic），list 同理 */
    detail: { value: string; label: string }[];
    list: { value: string; label: string }[];
}> = {
    maintenance: {
        static: [
            { value: 'view', label: '查看' },
            { value: 'create', label: '创建' },
            { value: 'export', label: '导出' },
        ],
        dynamic: [
            { value: 'submit', label: '提交审批' },
            { value: 'approve', label: '通过/退回' },
            { value: 'withdraw', label: '撤销' },
            { value: 'verify', label: '发起验收' },
            { value: 'appendMaterial', label: '追加物料' },
            { value: 'upload', label: '上传附件' },
        ],
        detail: [
            { value: 'view', label: '查看' },
            { value: 'create', label: '创建' },
            { value: 'export', label: '导出' },
            { value: 'submit', label: '提交审批' },
            { value: 'approve', label: '通过/退回' },
            { value: 'withdraw', label: '撤销' },
            { value: 'verify', label: '发起验收' },
            { value: 'appendMaterial', label: '追加物料' },
            { value: 'upload', label: '上传附件' },
        ],
        list: [
            { value: 'process', label: '处理' },
        ],
    },
    material: {
        static: [
            { value: 'view', label: '查看' },
            { value: 'create', label: '创建' },
            { value: 'export', label: '导出' },
        ],
        dynamic: [
            { value: 'submit', label: '提交审批' },
            { value: 'approve', label: '通过/退回' },
            { value: 'withdraw', label: '撤销' },
            { value: 'pickup', label: '领料' },
        ],
        detail: [
            { value: 'view', label: '查看' },
            { value: 'create', label: '创建' },
            { value: 'export', label: '导出' },
            { value: 'submit', label: '提交审批' },
            { value: 'approve', label: '通过/退回' },
            { value: 'withdraw', label: '撤销' },
            { value: 'pickup', label: '领料' },
        ],
        list: [
            { value: 'pickup', label: '领料' },
        ],
    },
    quality: {
        static: [
            { value: 'view', label: '查看' },
            { value: 'create', label: '创建' },
            { value: 'export', label: '导出' },
        ],
        dynamic: [
            { value: 'submit', label: '提交审批' },
            { value: 'approve', label: '通过/退回' },
            { value: 'withdraw', label: '撤销' },
        ],
        detail: [
            { value: 'view', label: '查看' },
            { value: 'create', label: '创建' },
            { value: 'export', label: '导出' },
            { value: 'submit', label: '提交审批' },
            { value: 'approve', label: '通过/退回' },
            { value: 'withdraw', label: '撤销' },
        ],
        list: [],
    },
    todo: {
        static: [
            { value: 'view', label: '查看' },
            { value: 'create', label: '创建' },
        ],
        dynamic: [
            { value: 'complete', label: '完成' },
        ],
        detail: [
            { value: 'view', label: '查看' },
            { value: 'create', label: '创建' },
            { value: 'complete', label: '完成' },
        ],
        list: [],
    },
    production: {
        static: [
            { value: 'view', label: '查看' },
            { value: 'create', label: '创建' },
            { value: 'export', label: '导出' },
        ],
        dynamic: [
            { value: 'submit', label: '提交审批' },
        ],
        detail: [
            { value: 'view', label: '查看' },
            { value: 'create', label: '创建' },
            { value: 'export', label: '导出' },
            { value: 'submit', label: '提交审批' },
        ],
        list: [],
    },
    inventory: {
        static: [
            { value: 'view', label: '查看' },
            { value: 'create', label: '创建' },
            { value: 'export', label: '导出' },
        ],
        dynamic: [],
        detail: [
            { value: 'view', label: '查看' },
            { value: 'create', label: '创建' },
            { value: 'export', label: '导出' },
        ],
        list: [],
    },
};

/** 按钮权限矩阵可使用的业务对象列表 */
export const PERM_BIZ_OBJECTS = [
    { value: 'maintenance', label: '维修工单' },
    { value: 'material', label: '用料申请单' },
    { value: 'quality', label: '质量检验单' },
    { value: 'todo', label: '待办事项' },
    { value: 'production', label: '生产批次' },
    { value: 'inventory', label: '库存记录' },
];

const PERM_STATUS_OPTIONS = [
    { value: 'draft', label: '草稿' },
    { value: 'pending', label: '审批中' },
    { value: 'waiting', label: '待审批' },
    { value: 'approved', label: '已同意' },
];

const PERM_IDENTITY_OPTIONS = [
    { value: 'creator', label: '创建人' },
    { value: 'approver', label: '当前审批人' },
];

export interface BizRuleForm {
    id?: string;
    name: string;
    code: string;
    bizObject: string[];
    timing: string[];
    priority: number;
    breakAfter: boolean;
    status: 'active' | 'inactive';
    scopeType: 'all' | 'org' | 'line';
    scopeOrgs: string[];
    scopeLines: string[];
    description: string;
    hasCondition: boolean;
    conditionGroups: ConditionGroup[];
    conditionGroupsLogic: 'AND' | 'OR';
    actions: ActionItem[];
    advanced: {
        async: boolean;
        maxRetry: number;
        timeout: number;
        ignoreError: boolean;
    };
    schedule?: ScheduleConfig;
    fieldChangedFields?: string[][];
    buttonPermissions: ButtonPermGroup[];
}

// ============ 辅助函数 ============

function genId() {
    return `_${Math.random().toString(36).slice(2, 9)}`;
}

export function generateCode() {
    return `RULE-${Date.now().toString(36).toUpperCase()}`;
}

function emptyCondition(): ConditionItem {
    return { id: genId(), field: '', operator: 'eq', valueType: 'fixed', value: '' };
}

function emptyConditionGroup(): ConditionGroup {
    return { id: genId(), logic: 'AND', conditions: [emptyCondition()] };
}

function emptyAction(): ActionItem {
    return { id: genId(), type: 'set_field', params: { field: '', value: '' } };
}

export function defaultForm(): BizRuleForm {
    return {
        name: '',
        code: generateCode(),
        bizObject: ['maintenance', 'material'],
        timing: [],
        priority: 10,
        breakAfter: false,
        status: 'active',
        scopeType: 'all',
        scopeOrgs: [],
        scopeLines: [],
        description: '',
        hasCondition: true,
        conditionGroups: [emptyConditionGroup()],
        conditionGroupsLogic: 'AND',
        actions: [emptyAction()],
        advanced: { async: false, maxRetry: 3, timeout: 30, ignoreError: false },
        buttonPermissions: [
            {
                bizObject: 'maintenance',
                rows: [
                    { id: genId(), bizObject: 'maintenance', status: 'draft', identityGroup: 'creator', detailButtons: ['submit', 'upload', 'appendMaterial'], listButtons: [] },
                    { id: genId(), bizObject: 'maintenance', status: 'pending', identityGroup: 'approver', detailButtons: ['approve', 'withdraw'], listButtons: [] },
                    { id: genId(), bizObject: 'maintenance', status: 'approved', identityGroup: 'creator', detailButtons: ['verify', 'upload'], listButtons: [] },
                ],
            },
            {
                bizObject: 'material',
                rows: [
                    { id: genId(), bizObject: 'material', status: 'draft', identityGroup: 'creator', detailButtons: ['submit', 'pickup'], listButtons: ['pickup'] },
                    { id: genId(), bizObject: 'material', status: 'pending', identityGroup: 'approver', detailButtons: ['approve'], listButtons: [] },
                ],
            },
        ],
    };
}

// ============ 接收人选择器 ============

const ALL_USER_OPTIONS = [
    { value: 'creator', label: '$创建人' },
    { value: 'assignee', label: '$负责人' },
    { value: 'manager', label: '$上级主管' },
    { value: 'user_wang', label: '王志强' },
    { value: 'user_li', label: '李明远' },
    { value: 'user_sun', label: '孙丽华' },
    { value: 'user_zhang', label: '张建平' },
];

const ALL_POSITION_OPTIONS = [
    { value: 'pos_admin', label: '$管理员角色' },
    { value: 'pos_production_supervisor', label: '生产主管' },
    { value: 'pos_quality_supervisor', label: '质量主管' },
    { value: 'pos_equipment_supervisor', label: '设备主管' },
    { value: 'pos_safety_office', label: '安全员' },
    { value: 'pos_observer', label: '中控操作员' },
];

const USER_PHONE_MAP: Record<string, string> = {
    user_wang: '138-0000-0001',
    user_li: '138-0000-0002',
    user_sun: '138-0000-0003',
    user_zhang: '138-0000-0004',
};

const RECEIVER_LABEL_MAP: Record<string, string> = Object.fromEntries(
    [...ALL_USER_OPTIONS, ...ALL_POSITION_OPTIONS].map((o) => [o.value, o.label]),
);

function getReceiverLabel(value: string): string {
    return RECEIVER_LABEL_MAP[value] || value;
}

function isUserReceiver(value: string): boolean {
    return !value.startsWith('pos_');
}

function ReceiverSelect({
    value,
    onChange,
}: {
    value: string[];
    onChange: (v: string[]) => void;
}) {
    const [activeType, setActiveType] = useState<'user' | 'position'>('user');
    const [search, setSearch] = useState('');

    const typeLabel = activeType === 'user' ? '用户' : '岗位';
    const allOptions = activeType === 'user' ? ALL_USER_OPTIONS : ALL_POSITION_OPTIONS;
    const filteredOptions = allOptions.filter(
        (o) => o.label.toLowerCase().includes(search.toLowerCase()),
    );

    const toggleReceiver = (val: string) => {
        const next = value.includes(val) ? value.filter((v) => v !== val) : [...value, val];
        onChange(next);
    };

    const renderOptionList = () => (
        <div style={{ maxHeight: 260, overflow: 'auto', marginTop: 8 }}>
            {filteredOptions.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
                    暂无匹配项
                </div>
            ) : (
                filteredOptions.map((opt) => (
                    <div
                        key={opt.value}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => toggleReceiver(opt.value)}
                        style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: value.includes(opt.value) ? '#e6f4ff' : 'transparent',
                            transition: 'background 0.2s',
                        }}
                    >
                        <Checkbox checked={value.includes(opt.value)} />
                        <span style={{ fontSize: 14 }}>{opt.label}</span>
                        {USER_PHONE_MAP[opt.value] ? (
                            <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{USER_PHONE_MAP[opt.value]}</span>
                        ) : null}
                    </div>
                ))
            )}
        </div>
    );

    return (
        <Select
            mode="multiple"
            value={value}
            onChange={onChange}
            placeholder="选择接收人或岗位"
            popupMatchSelectWidth={false}
            dropdownStyle={{ minWidth: 640 }}
            style={{ width: '100%' }}
            tagRender={({ value: val, closable, onClose }) => {
                const displayLabel = getReceiverLabel(String(val));
                const isUser = isUserReceiver(String(val));
                return (
                    <Tag
                        color={isUser ? 'blue' : 'orange'}
                        closable={closable}
                        onClose={onClose}
                        style={{ marginRight: 3 }}
                    >
                        {displayLabel}
                    </Tag>
                );
            }}
            dropdownRender={() => (
                <div style={{ padding: 12 }} onMouseDown={(e) => e.preventDefault()}>
                    {/* 顶部工具栏：类型切换 + 搜索 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ display: 'flex', flexShrink: 0, border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
                            <button
                                type="button"
                                onClick={() => { setActiveType('user'); setSearch(''); }}
                                style={{
                                    padding: '4px 16px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    background: activeType === 'user' ? '#1677ff' : '#fff',
                                    color: activeType === 'user' ? '#fff' : 'rgba(0,0,0,0.65)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                用户
                            </button>
                            <button
                                type="button"
                                onClick={() => { setActiveType('position'); setSearch(''); }}
                                style={{
                                    padding: '4px 16px',
                                    border: 'none',
                                    borderLeft: '1px solid #d9d9d9',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    background: activeType === 'position' ? '#1677ff' : '#fff',
                                    color: activeType === 'position' ? '#fff' : 'rgba(0,0,0,0.65)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                岗位
                            </button>
                        </div>
                        <Input
                            placeholder={`搜索${typeLabel}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            allowClear
                            size="small"
                            style={{ flex: 1 }}
                        />
                    </div>
                    {/* 选项列表 */}
                    {renderOptionList()}
                </div>
            )}
        />
    );
}

// ============ 规则抽屉组件 ============

export default function RuleDrawer({
    open,
    mode,
    initialData,
    onClose,
    onSave,
}: {
    open: boolean;
    mode: 'add' | 'edit';
    initialData?: Partial<BizRuleForm>;
    onClose: () => void;
    onSave: (data: BizRuleForm) => void;
}) {
    const [form, setForm] = useState<BizRuleForm>(defaultForm());
    const [activeBizObject, setActiveBizObject] = useState('maintenance');

    useEffect(() => {
        if (open) {
            if (initialData) {
                const merged = { ...defaultForm(), ...initialData };
                // 确保 bizObject 是数组
                if (!Array.isArray(merged.bizObject)) {
                    merged.bizObject = merged.bizObject ? [merged.bizObject as any] : [];
                }
                // 过滤掉当前业务对象不支持的时机（使用第一个 bizObject 的时机选项）
                const primaryBizObj = BIZ_OBJECTS.find((b) => b.value === merged.bizObject[0]);
                const validTimings = primaryBizObj?.timings || [];
                const filteredTiming = merged.timing.filter((t) => validTimings.includes(t));
                if (filteredTiming.length !== merged.timing.length) {
                    merged.timing = filteredTiming;
                    if (!filteredTiming.includes('scheduled')) {
                        merged.schedule = undefined;
                    }
                }
                if (merged.timing.includes('scheduled') && !merged.schedule) {
                    merged.schedule = { interval: 1, unit: 'day', hour: 9, minute: 0 };
                }
                // 同步 buttonPermissions 分组与 bizObject
                merged.buttonPermissions = merged.bizObject.map((biz: string) => {
                    const existing = merged.buttonPermissions?.find((g) => g.bizObject === biz);
                    return existing || { bizObject: biz, rows: [] };
                });
                setForm(merged);
                setActiveBizObject(merged.bizObject[0] || 'maintenance');
            } else {
                setForm(defaultForm());
                setActiveBizObject('maintenance');
            }
        }
    }, [open, initialData]);

    const updateForm = (patch: Partial<BizRuleForm>) => {
        setForm((prev) => ({ ...prev, ...patch }));
    };

    const handleBizObjectChange = (values: string[]) => {
        // 同步 buttonPermissions：保留已有分组，添加新分组，移除已删除的分组
        const syncedPerms = values.map((biz) => {
            const existing = form.buttonPermissions.find((g) => g.bizObject === biz);
            return existing || { bizObject: biz, rows: [] };
        });
        updateForm({ bizObject: values, timing: [], buttonPermissions: syncedPerms });
        setActiveBizObject(values[0] || 'maintenance');
    };

    const timingOptions = BIZ_OBJECTS.find((b) => b.value === activeBizObject)?.timings || [];

    const handleSubmit = () => {
        if (!form.name.trim()) {
            message.error('请输入规则名称');
            return;
        }
        if (form.timing.length === 0) {
            message.error('请至少选择一个应用时机');
            return;
        }
        onSave(form);
    };

    // ============ 条件构建器 ============

    const addConditionGroup = () => {
        updateForm({ conditionGroups: [...form.conditionGroups, emptyConditionGroup()] });
    };

    const removeConditionGroup = (gid: string) => {
        updateForm({ conditionGroups: form.conditionGroups.filter((g) => g.id !== gid) });
    };

    const updateConditionGroup = (gid: string, patch: Partial<ConditionGroup>) => {
        updateForm({
            conditionGroups: form.conditionGroups.map((g) => (g.id === gid ? { ...g, ...patch } : g)),
        });
    };

    const addCondition = (gid: string) => {
        updateForm({
            conditionGroups: form.conditionGroups.map((g) =>
                g.id === gid ? { ...g, conditions: [...g.conditions, emptyCondition()] } : g
            ),
        });
    };

    const removeCondition = (gid: string, cid: string) => {
        updateForm({
            conditionGroups: form.conditionGroups.map((g) =>
                g.id === gid ? { ...g, conditions: g.conditions.filter((c) => c.id !== cid) } : g
            ),
        });
    };

    const updateCondition = (gid: string, cid: string, patch: Partial<ConditionItem>) => {
        updateForm({
            conditionGroups: form.conditionGroups.map((g) =>
                g.id === gid
                    ? { ...g, conditions: g.conditions.map((c) => (c.id === cid ? { ...c, ...patch } : c)) }
                    : g
            ),
        });
    };

    // ============ 动作构建器 ============

    const addAction = () => {
        updateForm({ actions: [...form.actions, emptyAction()] });
    };

    const removeAction = (aid: string) => {
        updateForm({ actions: form.actions.filter((a) => a.id !== aid) });
    };

    const moveAction = (index: number, direction: -1 | 1) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= form.actions.length) return;
        const arr = [...form.actions];
        [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
        updateForm({ actions: arr });
    };

    const updateAction = (aid: string, patch: Partial<ActionItem>) => {
        updateForm({
            actions: form.actions.map((a) => (a.id === aid ? { ...a, ...patch } : a)),
        });
    };

    const updateActionParams = (aid: string, params: Record<string, any>) => {
        updateForm({
            actions: form.actions.map((a) => (a.id === aid ? { ...a, params: { ...a.params, ...params } } : a)),
        });
    };

    const addActionCondition = (aid: string) => {
        updateForm({
            actions: form.actions.map((a) =>
                a.id === aid ? { ...a, condition: emptyConditionGroup() } : a
            ),
        });
    };

    const removeActionCondition = (aid: string) => {
        updateForm({
            actions: form.actions.map((a) => {
                if (a.id !== aid) return a;
                const next = { ...a };
                delete next.condition;
                return next;
            }),
        });
    };

    const addActionCondItem = (aid: string) => {
        updateForm({
            actions: form.actions.map((a) =>
                a.id === aid && a.condition
                    ? { ...a, condition: { ...a.condition, conditions: [...a.condition.conditions, emptyCondition()] } }
                    : a
            ),
        });
    };

    const removeActionCondItem = (aid: string, cid: string) => {
        updateForm({
            actions: form.actions.map((a) =>
                a.id === aid && a.condition
                    ? {
                          ...a,
                          condition: {
                              ...a.condition,
                              conditions: a.condition.conditions.filter((c) => c.id !== cid),
                          },
                      }
                    : a
            ),
        });
    };

    const updateActionCondItem = (aid: string, cid: string, patch: Partial<ConditionItem>) => {
        updateForm({
            actions: form.actions.map((a) =>
                a.id === aid && a.condition
                    ? {
                          ...a,
                          condition: {
                              ...a.condition,
                              conditions: a.condition.conditions.map((c) =>
                                  c.id === cid ? { ...c, ...patch } : c
                              ),
                          },
                      }
                    : a
            ),
        });
    };

    const getFieldOptions = () => FIELD_OPTIONS[activeBizObject] || [];

    // ============ 按钮权限矩阵操作 ============

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['maintenance', 'material']));
    const [permFilter, setPermFilter] = useState<string[]>([]);

    const toggleGroup = (bizObj: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(bizObj)) next.delete(bizObj);
            else next.add(bizObj);
            return next;
        });
    };

    const addPermRow = (bizObj: string) => {
        updateForm({
            buttonPermissions: form.buttonPermissions.map((g) =>
                g.bizObject === bizObj
                    ? { ...g, rows: [...g.rows, { id: genId(), bizObject: bizObj, status: 'draft', identityGroup: 'creator', detailButtons: [], listButtons: [] }] }
                    : g
            ),
        });
    };

    const removePermRow = (bizObj: string, rowId: string) => {
        updateForm({
            buttonPermissions: form.buttonPermissions.map((g) =>
                g.bizObject === bizObj
                    ? { ...g, rows: g.rows.filter((r) => r.id !== rowId) }
                    : g
            ),
        });
    };

    const updatePermRow = (bizObj: string, rowId: string, patch: Partial<ButtonPermRow>) => {
        updateForm({
            buttonPermissions: form.buttonPermissions.map((g) =>
                g.bizObject === bizObj
                    ? { ...g, rows: g.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)) }
                    : g
            ),
        });
    };

    // 权限矩阵分组只看从 form.bizObject 派生，不允许独立增删
    const filteredPermGroups = permFilter.length > 0
        ? form.buttonPermissions.filter((g) => permFilter.includes(g.bizObject))
        : form.buttonPermissions;

    // "只看对象"下拉只显示已选业务对象
    const permFilterOptions = form.bizObject.map((b) => {
        const found = PERM_BIZ_OBJECTS.find((p) => p.value === b);
        return { value: b, label: found?.label || b };
    });

    return (
        <Drawer
            open={open}
            title={mode === 'add' ? '新建业务规则' : '编辑业务规则'}
            width={880}
            onClose={onClose}
            styles={{ body: { paddingBottom: 80 } }}
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <Button onClick={onClose}>取消</Button>
                    <Button type="primary" onClick={handleSubmit}>
                        保存
                    </Button>
                </div>
            }
        >
            {/* 基础信息 */}
            <Collapse defaultActiveKey={['basic']} style={{ marginBottom: 16 }}>
                <Panel header="基础信息" key="basic">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="规则名称" required>
                                <Input value={form.name} onChange={(e) => updateForm({ name: e.target.value })} placeholder="如：熟料游离钙超标锁定" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="规则编码" required>
                                <Input
                                    value={form.code}
                                    onChange={(e) => updateForm({ code: e.target.value })}
                                    addonAfter={<Button type="link" size="small" style={{ padding: 0 }} onClick={() => updateForm({ code: generateCode() })}>自动生成</Button>}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="业务对象" required>
                                <Select
                                    mode="multiple"
                                    value={form.bizObject}
                                    onChange={handleBizObjectChange}
                                    options={BIZ_OBJECTS.map((b) => ({ value: b.value, label: b.label }))}
                                    maxTagCount="responsive"
                                    placeholder="选择业务对象"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="优先级">
                                <InputNumber value={form.priority} onChange={(v) => updateForm({ priority: v || 0 })} min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="状态">
                                <Switch checked={form.status === 'active'} onChange={(v) => updateForm({ status: v ? 'active' : 'inactive' })} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="满足后终止后续规则">
                                <Switch checked={form.breakAfter} onChange={(v) => updateForm({ breakAfter: v })} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="生效范围">
                        <Radio.Group
                            value={form.scopeType}
                            onChange={(e) => updateForm({ scopeType: e.target.value })}
                            options={[
                                { value: 'all', label: '所有组织' },
                                { value: 'org', label: '指定组织' },
                                { value: 'line', label: '指定产线' },
                            ]}
                        />
                        {form.scopeType === 'org' && (
                            <TreeSelect
                                treeData={ORG_TREE}
                                value={form.scopeOrgs}
                                onChange={(v) => updateForm({ scopeOrgs: v as string[] })}
                                placeholder="选择组织"
                                style={{ marginTop: 8, width: '100%' }}
                                treeCheckable
                                showCheckedStrategy={TreeSelect.SHOW_ALL}
                                maxTagCount="responsive"
                                treeNodeLabelProp="fullTitle"
                            />
                        )}
                        {form.scopeType === 'line' && (
                            <TreeSelect
                                treeData={LINE_TREE}
                                value={form.scopeLines}
                                onChange={(v) => updateForm({ scopeLines: v as string[] })}
                                placeholder="选择产线"
                                style={{ marginTop: 8, width: '100%' }}
                                treeCheckable
                                showCheckedStrategy={TreeSelect.SHOW_ALL}
                                maxTagCount="responsive"
                                treeNodeLabelProp="fullTitle"
                            />
                        )}
                    </Form.Item>
                    <Form.Item label="描述">
                        <TextArea value={form.description} onChange={(e) => updateForm({ description: e.target.value })} rows={2} />
                    </Form.Item>
                </Panel>
            </Collapse>

            {/* 触发规则 / 按钮权限矩阵 */}
            <Tabs
                defaultActiveKey="trigger"
                items={[
                    {
                        key: 'trigger',
                        label: '触发规则',
                        children: (
                            <Collapse defaultActiveKey={['timing', 'condition', 'action', 'advanced']}>
                                {/* 应用时机（从基础信息移入） */}
                                <Panel header="应用时机" key="timing">
                                    <Form.Item required>
                                        <Checkbox.Group
                                            value={form.timing}
                                            onChange={(v) => {
                                                const timing = v as string[];
                                                if (!timing.includes('scheduled')) {
                                                    updateForm({ timing, schedule: undefined, fieldChangedFields: timing.includes('field_changed') ? form.fieldChangedFields : undefined });
                                                } else if (!timing.includes('field_changed')) {
                                                    updateForm({ timing, schedule: form.schedule || { interval: 1, unit: 'day', hour: 9, minute: 0 }, fieldChangedFields: undefined });
                                                } else {
                                                    updateForm({ timing, schedule: form.schedule || { interval: 1, unit: 'day', hour: 9, minute: 0 } });
                                                }
                                            }}
                                            options={timingOptions.map((t) => ({ value: t, label: TIMING_LABELS[t] }))}
                                        />
                                        {form.timing.includes('field_changed') && (
                                            <div style={{
                                                marginTop: 10,
                                                background: '#f6f8fa',
                                                border: '1px solid #e8e8e8',
                                                borderRadius: 6,
                                                padding: '12px 16px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}>
                                                <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap' }}>监听字段：</span>
                                                <Cascader
                                                    multiple
                                                    value={form.fieldChangedFields || []}
                                                    onChange={(v) => updateForm({ fieldChangedFields: v as string[][] })}
                                                    options={form.bizObject.map((biz) => {
                                                        const bizObj = BIZ_OBJECTS.find((b) => b.value === biz);
                                                        const fields = BIZ_OBJECT_FIELDS[biz] || [];
                                                        return {
                                                            value: biz,
                                                            label: bizObj?.label || biz,
                                                            children: [...fields, ...RELATED_FIELDS],
                                                        };
                                                    })}
                                                    placeholder="选择业务对象字段"
                                                    style={{ minWidth: 240 }}
                                                    size="small"
                                                />
                                            </div>
                                        )}
                                        {form.timing.includes('scheduled') && form.schedule && (
                                            <div style={{
                                                marginTop: 10,
                                                background: '#f6f8fa',
                                                border: '1px solid #e8e8e8',
                                                borderRadius: 6,
                                                padding: '12px 16px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                flexWrap: 'wrap',
                                            }}>
                                                <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap' }}>定时设置：每</span>
                                                <InputNumber
                                                    value={form.schedule?.interval ?? 1}
                                                    onChange={(v) => updateForm({ schedule: { ...form.schedule!, interval: v || 1 } })}
                                                    min={1}
                                                    style={{ width: 56 }}
                                                    size="small"
                                                />
                                                <Select
                                                    value={form.schedule?.unit || 'day'}
                                                    onChange={(v) => {
                                                        const unit = v as ScheduleConfig['unit'];
                                                        const base: ScheduleConfig = {
                                                            interval: form.schedule!.interval,
                                                            unit,
                                                            hour: form.schedule!.hour,
                                                            minute: form.schedule!.minute,
                                                        };
                                                        if (unit === 'month') base.day = form.schedule!.day ?? 1;
                                                        else if (unit === 'year') {
                                                            base.month = form.schedule!.month ?? 1;
                                                            base.day = form.schedule!.day ?? 1;
                                                        }
                                                        updateForm({ schedule: base });
                                                    }}
                                                    options={SCHEDULE_UNITS}
                                                    style={{ width: 68 }}
                                                    size="small"
                                                />
                                                {form.schedule?.unit === 'year' ? (
                                                    <>
                                                        <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>·</span>
                                                        <Select
                                                            value={form.schedule?.month ?? 1}
                                                            onChange={(v) => updateForm({ schedule: { ...form.schedule!, month: v } })}
                                                            options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1} 月` }))}
                                                            style={{ width: 76 }}
                                                            size="small"
                                                        />
                                                    </>
                                                ) : null}
                                                {form.schedule?.unit === 'month' || form.schedule?.unit === 'year' ? (
                                                    <>
                                                        <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>·</span>
                                                        <Select
                                                            value={form.schedule?.day ?? 1}
                                                            onChange={(v) => updateForm({ schedule: { ...form.schedule!, day: v } })}
                                                            options={Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `${i + 1} 日` }))}
                                                            style={{ width: 76 }}
                                                            size="small"
                                                        />
                                                    </>
                                                ) : null}
                                                {form.schedule?.unit !== 'hour' ? (
                                                    <>
                                                        <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>·</span>
                                                        <Select
                                                            value={form.schedule?.hour ?? 9}
                                                            onChange={(v) => updateForm({ schedule: { ...form.schedule!, hour: v } })}
                                                            options={Array.from({ length: 24 }, (_, i) => ({ value: i, label: `${String(i).padStart(2, '0')} 时` }))}
                                                            style={{ width: 88 }}
                                                            size="small"
                                                        />
                                                    </>
                                                ) : null}
                                                <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>:</span>
                                                <Select
                                                    value={form.schedule?.minute ?? 0}
                                                    onChange={(v) => updateForm({ schedule: { ...form.schedule!, minute: v } })}
                                                    options={Array.from({ length: 60 }, (_, i) => ({ value: i, label: `${String(i).padStart(2, '0')} 分` }))}
                                                    style={{ width: 88 }}
                                                    size="small"
                                                />
                                            </div>
                                        )}
                                    </Form.Item>
                                </Panel>

                                {/* 条件配置 */}
                                <Panel header="条件配置" key="condition">
                    <Radio.Group
                        value={form.hasCondition ? 'conditional' : 'unconditional'}
                        onChange={(e) => updateForm({ hasCondition: e.target.value === 'conditional' })}
                        style={{ marginBottom: 16 }}
                    >
                        <Radio value="conditional">根据匹配条件应用相应的动作</Radio>
                        <Radio value="unconditional">无条件加以应用</Radio>
                    </Radio.Group>

                    {form.hasCondition && (
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            {form.conditionGroups.map((group, gIndex) => (
                                <React.Fragment key={group.id}>
                                    {gIndex > 0 && (
                                        <div style={{ textAlign: 'center', margin: '-8px 0' }}>
                                            <Select
                                                value={form.conditionGroupsLogic}
                                                onChange={(v) => updateForm({ conditionGroupsLogic: v as 'AND' | 'OR' })}
                                                options={[
                                                    { value: 'AND', label: 'AND（所有条件组均满足）' },
                                                    { value: 'OR', label: 'OR（任一条件组满足）' },
                                                ]}
                                                style={{ width: 240 }}
                                                size="small"
                                            />
                                        </div>
                                    )}
                                    <Card
                                        size="small"
                                        title={
                                            <Space>
                                                <span>条件组 {gIndex + 1}</span>
                                                <Select
                                                    value={group.logic}
                                                    onChange={(v) => updateConditionGroup(group.id, { logic: v })}
                                                    options={[
                                                        { value: 'AND', label: '全部满足 (AND)' },
                                                        { value: 'OR', label: '任一满足 (OR)' },
                                                    ]}
                                                    style={{ width: 140 }}
                                                    size="small"
                                                />
                                            </Space>
                                        }
                                        extra={
                                            form.conditionGroups.length > 1 && (
                                                <Button type="text" danger size="small" icon={<Trash2 size={14} />} onClick={() => removeConditionGroup(group.id)}>
                                                    删除组
                                                </Button>
                                            )
                                        }
                                    >
                                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                                            {group.conditions.map((cond) => (
                                                <Row key={cond.id} gutter={8} align="middle">
                                                    <Col span={7}>
                                                        <Select
                                                            value={cond.field}
                                                            onChange={(v) => updateCondition(group.id, cond.id, { field: v })}
                                                            options={getFieldOptions()}
                                                            placeholder="选择字段"
                                                            size="small"
                                                            style={{ width: '100%' }}
                                                        />
                                                    </Col>
                                                    <Col span={5}>
                                                        <Select
                                                            value={cond.operator}
                                                            onChange={(v) => updateCondition(group.id, cond.id, { operator: v })}
                                                            options={OPERATORS}
                                                            placeholder="操作符"
                                                            size="small"
                                                            style={{ width: '100%' }}
                                                        />
                                                    </Col>
                                                    <Col span={4}>
                                                        <Select
                                                            value={cond.valueType}
                                                            onChange={(v) => updateCondition(group.id, cond.id, { valueType: v, value: '' })}
                                                            options={VALUE_TYPES}
                                                            placeholder="值类型"
                                                            size="small"
                                                            style={{ width: '100%' }}
                                                        />
                                                    </Col>
                                                    <Col span={6}>
                                                        {cond.valueType === 'fixed' && (
                                                            <Input
                                                                value={cond.value}
                                                                onChange={(e) => updateCondition(group.id, cond.id, { value: e.target.value })}
                                                                placeholder="输入值"
                                                                size="small"
                                                            />
                                                        )}
                                                        {cond.valueType === 'user_attr' && (
                                                            <Select
                                                                value={cond.value}
                                                                onChange={(v) => updateCondition(group.id, cond.id, { value: v })}
                                                                options={[
                                                                    { value: 'current_user_id', label: '当前用户ID' },
                                                                    { value: 'current_org_id', label: '当前组织ID' },
                                                                    { value: 'current_role', label: '当前角色' },
                                                                ]}
                                                                placeholder="选择属性"
                                                                size="small"
                                                                style={{ width: '100%' }}
                                                            />
                                                        )}
                                                        {cond.valueType === 'system_var' && (
                                                            <Select
                                                                value={cond.value}
                                                                onChange={(v) => updateCondition(group.id, cond.id, { value: v })}
                                                                options={[
                                                                    { value: 'now', label: '当前时间' },
                                                                    { value: 'today', label: '今天' },
                                                                    { value: 'org_name', label: '组织名称' },
                                                                ]}
                                                                placeholder="选择变量"
                                                                size="small"
                                                                style={{ width: '100%' }}
                                                            />
                                                        )}
                                                        {cond.valueType === 'expression' && (
                                                            <Input
                                                                value={cond.value}
                                                                onChange={(e) => updateCondition(group.id, cond.id, { value: e.target.value })}
                                                                placeholder="输入表达式"
                                                                size="small"
                                                            />
                                                        )}
                                                    </Col>
                                                    <Col span={2}>
                                                        {group.conditions.length > 1 && (
                                                            <Button
                                                                type="text"
                                                                danger
                                                                size="small"
                                                                icon={<Trash2 size={14} />}
                                                                onClick={() => removeCondition(group.id, cond.id)}
                                                            />
                                                        )}
                                                    </Col>
                                                </Row>
                                            ))}
                                            <Button type="dashed" size="small" icon={<Plus size={14} />} onClick={() => addCondition(group.id)} block>
                                                添加条件
                                            </Button>
                                        </Space>
                                    </Card>
                                </React.Fragment>
                            ))}
                            <Button type="dashed" icon={<Plus size={14} />} onClick={addConditionGroup} block>
                                添加条件组
                            </Button>
                        </Space>
                    )}
                </Panel>

                {/* 动作配置 */}
                <Panel header="动作配置" key="action">
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        {form.actions.map((action, index) => (
                            <Card
                                key={action.id}
                                size="small"
                                title={
                                    <Space>
                                        <span>动作 {index + 1}</span>
                                        <Select
                                            value={action.type}
                                            onChange={(v) => updateAction(action.id, { type: v, params: {} })}
                                            options={ACTION_TYPES}
                                            style={{ width: 160 }}
                                            size="small"
                                        />
                                    </Space>
                                }
                                extra={
                                    <Space>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<ArrowUp size={14} />}
                                            disabled={index === 0}
                                            onClick={() => moveAction(index, -1)}
                                        />
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<ArrowDown size={14} />}
                                            disabled={index === form.actions.length - 1}
                                            onClick={() => moveAction(index, 1)}
                                        />
                                        {form.actions.length > 1 && (
                                            <Button
                                                type="text"
                                                danger
                                                size="small"
                                                icon={<Trash2 size={14} />}
                                                onClick={() => removeAction(action.id)}
                                            />
                                        )}
                                    </Space>
                                }
                            >
                                {/* IF: 附加条件 */}
                                <div style={{ marginBottom: 16 }}>
                                    {!action.condition ? (
                                        <Button type="dashed" size="small" icon={<Plus size={14} />} onClick={() => addActionCondition(action.id)} block>
                                            添加条件
                                        </Button>
                                    ) : (
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <Space>
                                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.65)' }}>IF（满足时才执行此动作）</span>
                                                    <Select
                                                        value={action.condition.logic}
                                                        onChange={(v) => {
                                                            updateForm({
                                                                actions: form.actions.map((a) =>
                                                                    a.id === action.id && a.condition
                                                                        ? { ...a, condition: { ...a.condition, logic: v } }
                                                                        : a
                                                                ),
                                                            });
                                                        }}
                                                        options={[
                                                            { value: 'AND', label: '全部满足 (AND)' },
                                                            { value: 'OR', label: '任一满足 (OR)' },
                                                        ]}
                                                        style={{ width: 140 }}
                                                        size="small"
                                                    />
                                                </Space>
                                                <Button type="text" danger size="small" icon={<Trash2 size={14} />} onClick={() => removeActionCondition(action.id)}>
                                                    删除条件
                                                </Button>
                                            </div>
                                            <Space direction="vertical" style={{ width: '100%' }} size="small">
                                                {action.condition.conditions.map((cond) => (
                                                    <Row key={cond.id} gutter={8} align="middle">
                                                        <Col span={7}>
                                                            <Select
                                                                value={cond.field}
                                                                onChange={(v) => updateActionCondItem(action.id, cond.id, { field: v })}
                                                                options={getFieldOptions()}
                                                                placeholder="选择字段"
                                                                size="small"
                                                                style={{ width: '100%' }}
                                                            />
                                                        </Col>
                                                        <Col span={5}>
                                                            <Select
                                                                value={cond.operator}
                                                                onChange={(v) => updateActionCondItem(action.id, cond.id, { operator: v })}
                                                                options={OPERATORS}
                                                                placeholder="操作符"
                                                                size="small"
                                                                style={{ width: '100%' }}
                                                            />
                                                        </Col>
                                                        <Col span={4}>
                                                            <Select
                                                                value={cond.valueType}
                                                                onChange={(v) => updateActionCondItem(action.id, cond.id, { valueType: v, value: '' })}
                                                                options={VALUE_TYPES}
                                                                placeholder="值类型"
                                                                size="small"
                                                                style={{ width: '100%' }}
                                                            />
                                                        </Col>
                                                        <Col span={6}>
                                                            {cond.valueType === 'fixed' && (
                                                                <Input
                                                                    value={cond.value}
                                                                    onChange={(e) => updateActionCondItem(action.id, cond.id, { value: e.target.value })}
                                                                    placeholder="输入值"
                                                                    size="small"
                                                                />
                                                            )}
                                                            {cond.valueType === 'user_attr' && (
                                                                <Select
                                                                    value={cond.value}
                                                                    onChange={(v) => updateActionCondItem(action.id, cond.id, { value: v })}
                                                                    options={[
                                                                        { value: 'current_user_id', label: '当前用户ID' },
                                                                        { value: 'current_org_id', label: '当前组织ID' },
                                                                        { value: 'current_role', label: '当前角色' },
                                                                    ]}
                                                                    placeholder="选择属性"
                                                                    size="small"
                                                                    style={{ width: '100%' }}
                                                                />
                                                            )}
                                                            {cond.valueType === 'system_var' && (
                                                                <Select
                                                                    value={cond.value}
                                                                    onChange={(v) => updateActionCondItem(action.id, cond.id, { value: v })}
                                                                    options={[
                                                                        { value: 'now', label: '当前时间' },
                                                                        { value: 'today', label: '今天' },
                                                                        { value: 'org_name', label: '组织名称' },
                                                                    ]}
                                                                    placeholder="选择变量"
                                                                    size="small"
                                                                    style={{ width: '100%' }}
                                                                />
                                                            )}
                                                            {cond.valueType === 'expression' && (
                                                                <Input
                                                                    value={cond.value}
                                                                    onChange={(e) => updateActionCondItem(action.id, cond.id, { value: e.target.value })}
                                                                    placeholder="输入表达式"
                                                                    size="small"
                                                                />
                                                            )}
                                                        </Col>
                                                        <Col span={2}>
                                                            {(action.condition?.conditions?.length ?? 0) > 1 && (
                                                                <Button
                                                                    type="text"
                                                                    danger
                                                                    size="small"
                                                                    icon={<Trash2 size={14} />}
                                                                    onClick={() => removeActionCondItem(action.id, cond.id)}
                                                                />
                                                            )}
                                                        </Col>
                                                    </Row>
                                                ))}
                                                <Button type="dashed" size="small" icon={<Plus size={14} />} onClick={() => addActionCondItem(action.id)} block>
                                                    添加条件
                                                </Button>
                                            </Space>
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px dashed #d9d9d9' }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.65)' }}>THEN（执行以下动作）</span>
                                </div>

                                {/* THEN: 动作参数 */}
                                {/* 设置字段值 */}
                                {action.type === 'set_field' && (
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item label="目标字段" style={{ marginBottom: 0 }}>
                                                <Select
                                                    value={action.params.field}
                                                    onChange={(v) => updateActionParams(action.id, { field: v })}
                                                    options={getFieldOptions()}
                                                    placeholder="选择字段"
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="字段值" style={{ marginBottom: 0 }}>
                                                <Input
                                                    value={action.params.value}
                                                    onChange={(e) => updateActionParams(action.id, { value: e.target.value })}
                                                    placeholder="输入新值（支持表达式）"
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                )}

                                {/* 发送通知 */}
                                {action.type === 'send_notification' && (
                                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                                        <Form.Item label="通知方式" style={{ marginBottom: 0 }}>
                                            <Select
                                                mode="multiple"
                                                value={Array.isArray(action.params.channel) ? action.params.channel : (action.params.channel ? [action.params.channel] : [])}
                                                onChange={(v) => updateActionParams(action.id, { channel: v })}
                                                options={[
                                                    { value: 'site', label: '站内信' },
                                                    { value: 'email', label: '邮件' },
                                                    { value: 'dingtalk', label: '钉钉' },
                                                    { value: 'wecom', label: '企业微信' },
                                                ]}
                                            />
                                        </Form.Item>
                                        <Form.Item label="标题" style={{ marginBottom: 0 }}>
                                            <Input
                                                value={action.params.title}
                                                onChange={(e) => updateActionParams(action.id, { title: e.target.value })}
                                                placeholder="通知标题"
                                            />
                                        </Form.Item>
                                        <Form.Item label="内容" style={{ marginBottom: 0 }}>
                                            <TextArea
                                                value={action.params.content}
                                                onChange={(e) => updateActionParams(action.id, { content: e.target.value })}
                                                placeholder="通知内容，支持变量如 ${工单号}"
                                                rows={2}
                                            />
                                        </Form.Item>
                                        <Form.Item label="接收人" style={{ marginBottom: 0 }}>
                                            <ReceiverSelect
                                                value={action.params.receivers || []}
                                                onChange={(v) => updateActionParams(action.id, { receivers: v })}
                                            />
                                        </Form.Item>
                                    </Space>
                                )}

                                {/* 启动审批流 */}
                                {action.type === 'start_approval' && (
                                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                                        <Form.Item label="审批流程" style={{ marginBottom: 0 }}>
                                            <Select
                                                value={action.params.flowId}
                                                onChange={(v) => updateActionParams(action.id, { flowId: v })}
                                                options={[
                                                    { value: 'flow_1', label: '标准审批流程' },
                                                    { value: 'flow_2', label: '紧急审批流程' },
                                                    { value: 'flow_3', label: '质量审批流程' },
                                                ]}
                                                placeholder="选择审批流程"
                                            />
                                        </Form.Item>
                                        <Form.Item label="发起人" style={{ marginBottom: 0 }}>
                                            <Select
                                                value={action.params.initiator}
                                                onChange={(v) => updateActionParams(action.id, { initiator: v })}
                                                options={[
                                                    { value: 'current_user', label: '当前用户' },
                                                    { value: 'creator', label: '业务对象创建人' },
                                                    { value: 'assignee', label: '业务对象负责人' },
                                                ]}
                                                placeholder="选择发起人"
                                            />
                                        </Form.Item>
                                    </Space>
                                )}

                                {/* 调用API */}
                                {action.type === 'call_api' && (
                                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                                        <Form.Item label="请求方法" style={{ marginBottom: 0 }}>
                                            <Select
                                                value={action.params.method}
                                                onChange={(v) => updateActionParams(action.id, { method: v })}
                                                options={[
                                                    { value: 'GET', label: 'GET' },
                                                    { value: 'POST', label: 'POST' },
                                                    { value: 'PUT', label: 'PUT' },
                                                    { value: 'DELETE', label: 'DELETE' },
                                                ]}
                                            />
                                        </Form.Item>
                                        <Form.Item label="请求URL" style={{ marginBottom: 0 }}>
                                            <Input
                                                value={action.params.url}
                                                onChange={(e) => updateActionParams(action.id, { url: e.target.value })}
                                                placeholder="https://api.example.com/endpoint"
                                            />
                                        </Form.Item>
                                        <Form.Item label="请求体模板" style={{ marginBottom: 0 }}>
                                            <TextArea
                                                value={action.params.body}
                                                onChange={(e) => updateActionParams(action.id, { body: e.target.value })}
                                                placeholder='{"key": "value"}'
                                                rows={3}
                                            />
                                        </Form.Item>
                                    </Space>
                                )}

                                {/* 生成任务 */}
                                {action.type === 'create_task' && (
                                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                                        <Form.Item label="任务类型" style={{ marginBottom: 0 }}>
                                            <Select
                                                value={action.params.taskType}
                                                onChange={(v) => updateActionParams(action.id, { taskType: v })}
                                                options={[
                                                    { value: 'inspection', label: '设备点检' },
                                                    { value: 'restock', label: '生产补库' },
                                                    { value: 'repair', label: '维修工单' },
                                                ]}
                                                placeholder="选择任务类型"
                                            />
                                        </Form.Item>
                                        <Form.Item label="任务标题" style={{ marginBottom: 0 }}>
                                            <Input
                                                value={action.params.title}
                                                onChange={(e) => updateActionParams(action.id, { title: e.target.value })}
                                                placeholder="任务标题"
                                            />
                                        </Form.Item>
                                        <Form.Item label="负责人" style={{ marginBottom: 0 }}>
                                            <Select
                                                value={action.params.assignee}
                                                onChange={(v) => updateActionParams(action.id, { assignee: v })}
                                                options={[
                                                    { value: 'current_user', label: '当前用户' },
                                                    { value: 'role_production', label: '生产部' },
                                                    { value: 'role_quality', label: '质量部' },
                                                ]}
                                                placeholder="选择负责人"
                                            />
                                        </Form.Item>
                                    </Space>
                                )}

                                {/* 更新关联数据 */}
                                {action.type === 'update_related' && (
                                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                                        <Form.Item label="目标对象" style={{ marginBottom: 0 }}>
                                            <Select
                                                value={action.params.targetObject}
                                                onChange={(v) => updateActionParams(action.id, { targetObject: v })}
                                                options={BIZ_OBJECTS.map((b) => ({ value: b.value, label: b.label }))}
                                                placeholder="选择目标业务对象"
                                            />
                                        </Form.Item>
                                        <Form.Item label="目标字段" style={{ marginBottom: 0 }}>
                                            <Input
                                                value={action.params.field}
                                                onChange={(e) => updateActionParams(action.id, { field: e.target.value })}
                                                placeholder="目标字段"
                                            />
                                        </Form.Item>
                                        <Form.Item label="字段值" style={{ marginBottom: 0 }}>
                                            <Input
                                                value={action.params.value}
                                                onChange={(e) => updateActionParams(action.id, { value: e.target.value })}
                                                placeholder="新值（支持表达式）"
                                            />
                                        </Form.Item>
                                    </Space>
                                )}


                            </Card>
                        ))}
                        <Button type="dashed" icon={<Plus size={14} />} onClick={addAction} block>
                            添加动作
                        </Button>
                    </Space>
                </Panel>

                {/* 高级配置 */}
                <Panel header="高级配置" key="advanced">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="异步执行">
                                <Switch checked={form.advanced.async} onChange={(v) => updateForm({ advanced: { ...form.advanced, async: v } })} />
                                <span style={{ marginLeft: 8, color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                                    异步执行不影响主事务
                                </span>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="忽略异常">
                                <Switch checked={form.advanced.ignoreError} onChange={(v) => updateForm({ advanced: { ...form.advanced, ignoreError: v } })} />
                                <span style={{ marginLeft: 8, color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                                    异常时继续执行后续动作
                                </span>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="最大重试次数">
                                <InputNumber
                                    value={form.advanced.maxRetry}
                                    onChange={(v) => updateForm({ advanced: { ...form.advanced, maxRetry: v || 0 } })}
                                    min={0}
                                    max={10}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="超时时间（秒）">
                                <InputNumber
                                    value={form.advanced.timeout}
                                    onChange={(v) => updateForm({ advanced: { ...form.advanced, timeout: v || 0 } })}
                                    min={1}
                                    max={300}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Panel>
            </Collapse>
                        ),
                    },
                    {
                        key: 'buttonPerm',
                        label: '按钮权限矩阵',
                        children: (
                            <div>
                                {/* 配置指引提示条 */}
                                <div style={{
                                    background: '#e6f4ff',
                                    border: '1px solid #91caff',
                                    borderRadius: 6,
                                    padding: '10px 16px',
                                    marginBottom: 16,
                                    fontSize: 13,
                                    color: 'rgba(0,0,0,0.65)',
                                    lineHeight: 1.8,
                                }}>
                                    <span style={{ marginRight: 6 }}>💡</span>
                                    <strong>配置指引：</strong>本矩阵仅控制「动态按钮组」按钮（如提交、通过、退回、撤销、验收等）在不同状态下的显隐。静态类按钮（如创建、导出、查看列表）请移步【角色管理】配置。
                                </div>

                                {/* 顶部筛选 */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                    <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap' }}>只看对象：</span>
                                    <Select
                                        mode="multiple"
                                        value={permFilter}
                                        onChange={(v) => setPermFilter(v as string[])}
                                        options={permFilterOptions}
                                        placeholder="全部对象"
                                        allowClear
                                        style={{ minWidth: 240 }}
                                        maxTagCount="responsive"
                                    />
                                </div>

                                {/* 分组表格 */}
                                {filteredPermGroups.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(0,0,0,0.45)' }}>
                                        请在基础信息中选择业务对象
                                    </div>
                                ) : (
                                    filteredPermGroups.map((group) => {
                                        const bizLabel = PERM_BIZ_OBJECTS.find((b) => b.value === group.bizObject)?.label || group.bizObject;
                                        const btnConfig = BIZ_OBJECT_BUTTONS[group.bizObject] || { detail: [], list: [], static: [], dynamic: [] };
                                        const isExpanded = expandedGroups.has(group.bizObject);

                                        return (
                                            <div key={group.bizObject} style={{ marginBottom: 16, border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
                                                {/* 分组标题行 */}
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '10px 16px',
                                                        background: '#fafafa',
                                                        borderBottom: isExpanded ? '1px solid #f0f0f0' : 'none',
                                                        gap: 12,
                                                    }}
                                                >
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                        onClick={() => toggleGroup(group.bizObject)}
                                                    />
                                                    <span style={{ fontWeight: 600, fontSize: 14 }}>{bizLabel}</span>
                                                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{group.rows.length} 条配置</span>
                                                    <div style={{ flex: 1 }} />
                                                    <Button type="dashed" size="small" icon={<Plus size={14} />} onClick={() => addPermRow(group.bizObject)}>
                                                        添加行
                                                    </Button>
                                                </div>

                                                {/* 展开的子行表格 */}
                                                {isExpanded && (
                                                    <div style={{ overflowX: 'auto' }}>
                                                        {/* 表头 */}
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '120px 120px 160px 1fr 1fr 60px',
                                                            gap: 0,
                                                            background: '#f5f5f5',
                                                            borderBottom: '1px solid #f0f0f0',
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                            color: 'rgba(0,0,0,0.65)',
                                                        }}>
                                                            <div style={{ padding: '8px 12px' }}>业务对象</div>
                                                            <div style={{ padding: '8px 12px' }}>状态</div>
                                                            <div style={{ padding: '8px 12px' }}>身份组</div>
                                                            <div style={{ padding: '8px 12px' }}>①详情页流程按钮</div>
                                                            <div style={{ padding: '8px 12px' }}>②列表操作列按钮</div>
                                                            <div style={{ padding: '8px 12px' }}>操作</div>
                                                        </div>
                                                        {/* 子行 */}
                                                        {group.rows.length === 0 ? (
                                                            <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
                                                                暂无配置行，点击"添加行"新增
                                                            </div>
                                                        ) : (
                                                            group.rows.map((row) => (
                                                                <div
                                                                    key={row.id}
                                                                    style={{
                                                                        display: 'grid',
                                                                        gridTemplateColumns: '120px 120px 160px 1fr 1fr 60px',
                                                                        gap: 0,
                                                                        borderBottom: '1px solid #f5f5f5',
                                                                        alignItems: 'center',
                                                                        fontSize: 13,
                                                                    }}
                                                                >
                                                                    {/* 业务对象列 — 子行缩进显示 */}
                                                                    <div style={{ padding: '8px 12px', color: 'rgba(0,0,0,0.45)' }}>
                                                                        └ {bizLabel}
                                                                    </div>
                                                                    {/* 状态 */}
                                                                    <div style={{ padding: '8px 12px' }}>
                                                                        <Select
                                                                            value={row.status}
                                                                            onChange={(v) => updatePermRow(group.bizObject, row.id, { status: v })}
                                                                            options={PERM_STATUS_OPTIONS}
                                                                            size="small"
                                                                            style={{ width: '100%' }}
                                                                        />
                                                                    </div>
                                                                    {/* 身份组 */}
                                                                    <div style={{ padding: '8px 12px' }}>
                                                                        <Select
                                                                            value={row.identityGroup}
                                                                            onChange={(v) => updatePermRow(group.bizObject, row.id, { identityGroup: v })}
                                                                            options={PERM_IDENTITY_OPTIONS}
                                                                            size="small"
                                                                            style={{ width: '100%' }}
                                                                        />
                                                                    </div>
                                                                    {/* 详情页流程按钮 — 仅显示 dynamic 类型 */}
                                                                    <div style={{ padding: '8px 12px' }}>
                                                                        <Checkbox.Group
                                                                            value={row.detailButtons}
                                                                            onChange={(v) => updatePermRow(group.bizObject, row.id, { detailButtons: v as string[] })}
                                                                            options={btnConfig.dynamic}
                                                                        />
                                                                    </div>
                                                                    {/* 列表操作列按钮 */}
                                                                    <div style={{ padding: '8px 12px' }}>
                                                                        <Checkbox.Group
                                                                            value={row.listButtons}
                                                                            onChange={(v) => updatePermRow(group.bizObject, row.id, { listButtons: v as string[] })}
                                                                            options={btnConfig.list}
                                                                        />
                                                                    </div>
                                                                    {/* 操作 */}
                                                                    <div style={{ padding: '8px 12px' }}>
                                                                        <Button
                                                                            type="text"
                                                                            danger
                                                                            size="small"
                                                                            icon={<Trash2 size={14} />}
                                                                            onClick={() => removePermRow(group.bizObject, row.id)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        ),
                    },
                ]}
            />
        </Drawer>
    );
}
