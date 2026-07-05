import React, { useState } from 'react';
import dayjs from 'dayjs';
import {
    ShieldCheck,
    Plus,
    Pencil,
    Trash2,
    Search,
    Users,
    Clock,
    Save,
    Layers,
    UserPlus,
} from 'lucide-react';
import {
    Table,
    Button,
    Input,
    Select,
    Modal,
    Form,
    Tag,
    Space,
    Row,
    Col,
    Drawer,
    Tabs,
    Tree,
    Checkbox,
    Radio,
    Pagination,
    message,
    Spin,
    Avatar,
    Switch,
    Collapse,
    InputNumber,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';

type Role = {
    id: string;
    name: string;
    code: string;
    type: 'system' | 'custom';
    description: string;
    parentId?: string;
    parentName?: string;
    permissions: string[];
    dataScopeRule?: string;
    fieldRules?: string[];
    expiryDate?: string;
    userCount: number;
    status: 'active' | 'inactive';
    fieldRuleOverrides?: Record<string, Record<string, FieldOverrideItem>>;
    dataPolicyInstances?: DataPolicyInstance[];
};

// ===== 字段权限 & 数据权限相关类型（与权限管理模块对齐） =====
type FieldPermissionType = 'hidden' | 'readonly' | 'editable';
type MaskingType = 'none' | 'phone' | 'idCard' | 'custom';
type ConditionType = 'userAttr' | 'role' | 'custom';

interface ConditionPermission {
    id: string;
    name?: string;
    conditionType: ConditionType;
    config: any;
    permission: FieldPermissionType;
    priority: number;
}

interface FieldConfig {
    fieldName: string;
    fieldLabel: string;
    fieldType: string;
    defaultPermission: FieldPermissionType;
    conditions: ConditionPermission[];
    maskingRule: MaskingType;
    maskingCustom?: string;
}

interface FieldOverrideItem {
    defaultPermission: FieldPermissionType;
    conditions: ConditionPermission[];
    maskingRule: MaskingType;
    maskingCustom?: string;
}

interface FieldRule {
    id: string;
    name: string;
    code: string;
    entity: string;
    description?: string;
    status: 'active' | 'inactive';
    fieldConfigs: FieldConfig[];
}

type PolicyType = 'org' | 'dimension' | 'userAttr' | 'sql';

interface DataPolicy {
    id: string;
    name: string;
    code: string;
    entities: string[];
    type: PolicyType;
    status: 'active' | 'inactive';
    description?: string;
    ruleConfig?: any;
}

interface DataPolicyInstance {
    policyId: string;
    params: Record<string, any>;
}

const PERMISSION_LABEL: Record<FieldPermissionType, string> = {
    hidden: '隐藏',
    readonly: '只读',
    editable: '可编辑',
};

const PERMISSION_COLOR: Record<FieldPermissionType, string> = {
    hidden: 'error',
    readonly: 'warning',
    editable: 'success',
};

const MASKING_LABEL: Record<MaskingType, string> = {
    none: '无',
    phone: '手机号脱敏',
    idCard: '身份证脱敏',
    custom: '自定义正则',
};

const CONDITION_TYPE_LABEL: Record<ConditionType, string> = {
    userAttr: '用户属性匹配',
    role: '角色匹配',
    custom: '自定义表达式',
};

const typeMap: Record<PolicyType, string> = {
    org: '组织与层级',
    dimension: '维度列表',
    userAttr: '用户属性',
    sql: '自定义SQL条件',
};

// 从权限管理模块同步的字段权限规则
const allFieldRules: FieldRule[] = [
    {
        id: 'fr1',
        name: '设备档案字段权限',
        code: 'field_perm_device',
        entity: '设备档案',
        description: '限制设备档案中价格、联系方式等敏感字段的可见性和编辑权限',
        status: 'active',
        fieldConfigs: [
            { fieldName: 'manageSection', fieldLabel: '管理工段', fieldType: '文本', defaultPermission: 'editable', conditions: [], maskingRule: 'none' },
            { fieldName: 'deviceCode', fieldLabel: '设备编码', fieldType: '文本', defaultPermission: 'readonly', conditions: [
                { id: 'c1', conditionType: 'role', config: { roles: ['客服'] }, permission: 'editable', priority: 1 },
            ], maskingRule: 'none' },
            { fieldName: 'purchasePrice', fieldLabel: '采购价格', fieldType: '数值', defaultPermission: 'hidden', conditions: [
                { id: 'c2', conditionType: 'role', config: { roles: ['财务经理'] }, permission: 'readonly', priority: 1 },
            ], maskingRule: 'none' },
            { fieldName: 'phone', fieldLabel: '联系电话', fieldType: '手机号', defaultPermission: 'readonly', conditions: [], maskingRule: 'phone' },
        ],
    },
    {
        id: 'fr2',
        name: '销售合同字段权限',
        code: 'field_perm_contract',
        entity: '销售合同',
        description: '销售合同金额和折扣率仅财务和销售经理可编辑',
        status: 'active',
        fieldConfigs: [
            { fieldName: 'amount', fieldLabel: '合同金额', fieldType: '数值', defaultPermission: 'readonly', conditions: [
                { id: 'c4', conditionType: 'role', config: { roles: ['销售经理', '财务经理'] }, permission: 'editable', priority: 1 },
            ], maskingRule: 'none' },
            { fieldName: 'discountRate', fieldLabel: '折扣率', fieldType: '数值', defaultPermission: 'readonly', conditions: [
                { id: 'c5', conditionType: 'role', config: { roles: ['财务经理'] }, permission: 'editable', priority: 1 },
            ], maskingRule: 'none' },
        ],
    },
    {
        id: 'fr3',
        name: '维修工单字段权限',
        code: 'field_perm_wo',
        entity: '维修工单',
        description: '维修费用仅管理层可见',
        status: 'inactive',
        fieldConfigs: [
            { fieldName: 'repairCost', fieldLabel: '维修费用', fieldType: '数值', defaultPermission: 'hidden', conditions: [
                { id: 'c6', conditionType: 'role', config: { roles: ['工厂管理员', '财务经理'] }, permission: 'readonly', priority: 1 },
            ], maskingRule: 'none' },
        ],
    },
];

// 从权限管理模块同步的数据权限策略
const allDataPolicies: DataPolicy[] = [
    { id: 'dp1', name: '工厂数据权限', code: 'data_scope_factory', entities: ['设备', '维修工单'], type: 'org', status: 'active', description: '限制用户只能查看本工厂及下级工厂的数据', ruleConfig: { baseScope: 'selfAndChildren', parametrized: false } },
    { id: 'dp2', name: '窑线数据权限', code: 'data_scope_kiln_line', entities: ['窑系统运行记录'], type: 'dimension', status: 'active', description: '按产线维度过滤数据', ruleConfig: { dimensionType: '产线', rules: [{ matchMode: 'list' }] } },
    { id: 'dp3', name: '客户区域权限', code: 'data_scope_customer_area', entities: ['销售订单'], type: 'userAttr', status: 'active', description: '仅查看本人负责区域的销售数据' },
    { id: 'dp4', name: '物料类型权限', code: 'data_scope_material_type', entities: ['物料库存'], type: 'sql', status: 'inactive', description: '通过自定义SQL限制物料类型可见范围' },
    { id: 'dp5', name: '指定组织数据权限', code: 'data_scope_specified_org', entities: ['设备', '维修工单'], type: 'org', status: 'active', description: '仅查看指定组织的数据', ruleConfig: { baseScope: 'specified', parametrized: true } },
];

function isPolicyParametrized(policy: DataPolicy): boolean {
    if (!policy.ruleConfig) return false;
    if (policy.type === 'org' && policy.ruleConfig.baseScope === 'specified') return true;
    if (policy.type === 'dimension') {
        const rules = policy.ruleConfig.rules || [];
        return rules.some((r: any) => r.matchMode === 'list');
    }
    return false;
}

const initialRoles: Role[] = [
    {
        id: 'r1',
        name: '系统管理员',
        code: 'ROLE_ADMIN',
        type: 'system',
        description: '拥有系统全部权限，可进行任何配置操作',
        permissions: ['所有菜单', '所有按钮', '所有API'],
        dataScopeRule: '全部可见',
        userCount: 2,
        status: 'active',
    },
    {
        id: 'r2',
        name: '窑操基础',
        code: 'ROLE_KILN_BASIC',
        type: 'custom',
        description: '回转窑基础操作权限',
        permissions: ['窑系统监控', '参数查看', '交接班记录'],
        dataScopeRule: '仅本级组织',
        userCount: 12,
        status: 'active',
    },
    {
        id: 'r3',
        name: '窑操高级',
        code: 'ROLE_KILN_ADV',
        type: 'custom',
        description: '继承窑操基础，增加参数调整与报警处理',
        parentId: 'r2',
        parentName: '窑操基础',
        permissions: ['窑系统监控', '参数查看', '交接班记录', '参数调整', '报警确认'],
        dataScopeRule: '本级及下级组织',
        userCount: 6,
        status: 'active',
    },
    {
        id: 'r4',
        name: '生产报表审核',
        code: 'ROLE_PROD_AUDIT',
        type: 'custom',
        description: '审核每日生产报表与能耗数据',
        permissions: ['生产报表查看', '生产报表审核', '能耗分析'],
        dataScopeRule: '本级及下级组织',
        userCount: 4,
        status: 'active',
    },
    {
        id: 'r5',
        name: '车间安全管理',
        code: 'ROLE_HSE_MGR',
        type: 'custom',
        description: '负责车间安全检查、隐患整改与事故上报',
        permissions: ['安全检查表', '隐患整改', '事故上报', '安全培训记录'],
        dataScopeRule: '仅本级组织',
        userCount: 5,
        status: 'active',
    },
    {
        id: 'r6',
        name: '内部审计（临时）',
        code: 'ROLE_AUDIT_TMP',
        type: 'custom',
        description: '临时审计权限，用于季度财务审计',
        permissions: ['财务查看', '合同查看', '审批流查看'],
        dataScopeRule: '全部可见',
        expiryDate: '2025-06-30',
        userCount: 3,
        status: 'active',
    },
    {
        id: 'r7',
        name: '配方管理',
        code: 'ROLE_FORMULA',
        type: 'custom',
        description: '管理水泥配方与原材料配比',
        permissions: ['配方查看', '配方编辑', '配方审批'],
        fieldRules: ['配方成本-仅财务经理可见'],
        dataScopeRule: '仅本级组织',
        userCount: 0,
        status: 'inactive',
    },
];

 const orgTreeOptions = [
    { id: '1', name: '苏州中材建设有限公司', level: 0 },
    { id: '2', name: '伊拉克区域公司', level: 1 },
    { id: '3', name: 'DCC水泥厂', level: 2 },
    { id: '4', name: '石灰石矿山', level: 3 },
    { id: '5', name: '烧成车间', level: 3 },
    { id: '6', name: '窑系统一班', level: 4 },
    { id: '7', name: '窑系统二班', level: 4 },
    { id: '8', name: '窑系统三班', level: 4 },
    { id: '9', name: '制成车间', level: 3 },
    { id: '10', name: '磨机一班', level: 4 },
    { id: '11', name: '磨机二班', level: 4 },
    { id: '12', name: '中控室', level: 3 },
    { id: '13', name: 'Duhok粉磨站', level: 2 },
];

type UserOrgNode = { title: string; key: string; children?: UserOrgNode[] };

const pickerOrgUsers: Record<string, string[]> = {
    'DCC水泥厂': ['王志强', 'Ali Hassan'],
    '石灰石矿山': ['赵大勇'],
    '烧成车间': ['孙立军', '周海涛', '李浩', '陈斌'],
    '窑系统一班': [],
    '窑系统二班': [],
    '窑系统三班': [],
    '制成车间': ['陈铁军', '杨杰', '黄飞', '周磊', '吴强', '郑伟'],
    '磨机一班': [],
    '磨机二班': [],
    '中控室': ['张伟', '刘强', '杨磊', '黄涛', '周军', '吴勇', '郑明', '孙峰', '钱辉', '赵亮', '王鹏'],
    '伊拉克区域公司': ['李明远'],
    'Duhok粉磨站': [],
};

function buildUserPickerTree(): DataNode[] {
    const userNodes = (orgName: string): DataNode[] =>
        (pickerOrgUsers[orgName] || []).map((name) => ({ title: name, key: name, isLeaf: true }));
    return [
        {
            title: '苏州中材建设有限公司',
            key: 'org-root',
            selectable: false,
            children: [
                {
                    title: '伊拉克区域公司',
                    key: 'org-iraq',
                    selectable: false,
                    children: [
                        ...userNodes('伊拉克区域公司'),
                        {
                            title: 'DCC水泥厂',
                            key: 'org-dcc',
                            selectable: false,
                            children: [
                                ...userNodes('DCC水泥厂'),
                                { title: '石灰石矿山', key: 'org-矿山', children: userNodes('石灰石矿山') },
                                {
                                    title: '烧成车间', key: 'org-烧成', children: [
                                        ...userNodes('烧成车间'),
                                        ...userNodes('窑系统一班'), ...userNodes('窑系统二班'), ...userNodes('窑系统三班'),
                                    ],
                                },
                                {
                                    title: '制成车间', key: 'org-制成', children: [
                                        ...userNodes('制成车间'),
                                        ...userNodes('磨机一班'), ...userNodes('磨机二班'),
                                    ],
                                },
                                { title: '中控室', key: 'org-中控', children: userNodes('中控室') },
                            ],
                        },
                        { title: 'Duhok粉磨站', key: 'org-duhok', children: userNodes('Duhok粉磨站') },
                    ],
                },
            ],
        },
    ];
}

const pickerTreeData = buildUserPickerTree();

function getAllUserKeys(nodes: DataNode[]): string[] {
    const keys: string[] = [];
    for (const n of nodes) {
        if (n.isLeaf) keys.push(n.key as string);
        if (n.children) keys.push(...getAllUserKeys(n.children));
    }
    return keys;
}
const allPickerUserKeys = getAllUserKeys(pickerTreeData);

function getAllExpandableKeys(nodes: DataNode[]): string[] {
    const keys: string[] = [];
    for (const n of nodes) {
        if (n.children && n.children.length > 0) {
            keys.push(n.key as string);
            keys.push(...getAllExpandableKeys(n.children));
        }
    }
    return keys;
}
const allExpandableKeys = getAllExpandableKeys(pickerTreeData);

function getParentKeys(nodes: DataNode[], selectedUsers: string[]): string[] {
    const parentKeys: string[] = [];
    for (const node of nodes) {
        if (!node.children || node.children.length === 0) continue;
        const childUserKeys = getAllUserKeys(node.children);
        if (childUserKeys.length > 0 && childUserKeys.every((k) => selectedUsers.includes(k))) {
            parentKeys.push(node.key as string);
        }
        parentKeys.push(...getParentKeys(node.children, selectedUsers));
    }
    return parentKeys;
}

function filterTreeData(nodes: DataNode[], keyword: string): DataNode[] {
    if (!keyword) return nodes;
    const lower = keyword.toLowerCase();
    const filtered: DataNode[] = [];
    for (const node of nodes) {
        const titleMatches = String(node.title).toLowerCase().includes(lower);
        const filteredChildren = node.children ? filterTreeData(node.children, keyword) : [];
        if (titleMatches || filteredChildren.length > 0) {
            filtered.push({ ...node, children: titleMatches ? node.children : filteredChildren });
        }
    }
    return filtered;
}

function collectExpandedKeys(nodes: DataNode[], keyword: string): string[] {
    if (!keyword) return [];
    const keys: string[] = [];
    const lower = keyword.toLowerCase();
    for (const node of nodes) {
        if (node.children && node.children.length > 0) {
            const childMatches = node.children.some((c) =>
                c.isLeaf ? String(c.title).toLowerCase().includes(lower) : true
            ) || collectExpandedKeys(node.children, keyword).length > 0;
            if (childMatches) keys.push(node.key as string);
            keys.push(...collectExpandedKeys(node.children, keyword));
        }
    }
    return keys;
}

 type MenuNode = { label: string; children?: MenuNode[] };

 const webMenuTree: MenuNode[] = [
    {
        label: '生产管理',
        children: [
            { label: '基础设置' }, { label: '中控操作' }, { label: '生产计划' },
            { label: '生产日报审核' }, { label: '生产报表' }, { label: '生产计算配置' },
            { label: '中控记录' }, { label: '交接班记录' }, { label: '报表查询' },
            { label: '窑干控配置' }, { label: '交接班管理' }, { label: '接口工具' },
            { label: '人工数据录入' },
        ],
    },
    {
        label: '设备管理',
        children: [
            { label: '全息管理', children: [
                { label: '设备台账' }, { label: '二维码下载' },
                { label: '巡检标准' }, { label: '润滑标准' },
                { label: '报修记录' }, { label: '维修管理' },
            ]},
            { label: '巡检管理' }, { label: '润滑管理' },
            { label: '缺陷管理' }, { label: '预警中心' },
        ],
    },
    { label: '质量管理' }, { label: '不合格' },
    { label: '整改' }, { label: '奖惩' },
    { label: '下发通知' }, { label: '质检记录' },
    { label: '视频监控' }, { label: '仓储管理' },
    { label: '工厂建模' }, { label: '安全管理' },
    { label: '知识库' },
];

 const appMenuTree: MenuNode[] = [
    { label: '首页' }, { label: '生产看板' },
    { label: '设备巡检' }, { label: '隐患上报' },
    { label: '交接班' }, { label: '质检录入' },
    { label: '消息中心' }, { label: '个人中心' },
];

 function toTreeData(nodes: MenuNode[]): DataNode[] {
    return nodes.map((n, i) => ({
        key: n.label,
        title: n.label,
        children: n.children ? toTreeData(n.children) : undefined,
    }));
}

 function getLeafLabels(nodes: MenuNode[]): string[] {
    const result: string[] = [];
    for (const node of nodes) {
        if (!node.children || node.children.length === 0) {
            result.push(node.label);
        } else {
            result.push(...getLeafLabels(node.children));
        }
    }
    return result;
}

function isLeafNode(n: MenuNode): boolean {
    return !n.children || n.children.length === 0;
}

function buildTreeData(nodes: MenuNode[]): DataNode[] {
    return nodes.map((n) => {
        const key = n.label;
        if (isLeafNode(n)) {
            return { key, title: n.label, className: 'tree-leaf-item' };
        }
        const allChildrenAreLeaves = n.children!.every(isLeafNode);
        return {
            key,
            title: n.label,
            className: allChildrenAreLeaves ? 'tree-leaf-group' : undefined,
            children: buildTreeData(n.children!),
        };
    });
}

function getLeafKeys(nodes: MenuNode[]): string[] {
    const res: string[] = [];
    for (const n of nodes) {
        if (!n.children || n.children.length === 0) res.push(n.label);
        else res.push(...getLeafKeys(n.children));
    }
    return res;
}

function isNodeFullyChecked(node: MenuNode, checkedKeys: string[]): boolean {
    if (!node.children || node.children.length === 0) {
        return checkedKeys.includes(node.label);
    }
    return node.children.every((c) => isNodeFullyChecked(c, checkedKeys));
}

function isNodeIndeterminate(node: MenuNode, checkedKeys: string[]): boolean {
    if (!node.children || node.children.length === 0) return false;
    const leafKeys = getLeafKeys([node]);
    const checkedCount = leafKeys.filter((k) => checkedKeys.includes(k)).length;
    return checkedCount > 0 && checkedCount < leafKeys.length;
}

function recomputeAncestors(nodes: MenuNode[], checkedKeys: Set<string>) {
    for (const node of nodes) {
        if (!node.children || node.children.length === 0) continue;
        const childLeaves = getLeafKeys(node.children);
        if (childLeaves.every((k) => checkedKeys.has(k))) {
            checkedKeys.add(node.label);
        } else {
            checkedKeys.delete(node.label);
        }
        recomputeAncestors(node.children, checkedKeys);
    }
}

interface MenuTreeProps {
    rootNodes: MenuNode[];
    checkedKeys: string[];
    onChange: (keys: string[]) => void;
    level?: number;
    nodes?: MenuNode[];
}

function MenuTree({ rootNodes, checkedKeys, onChange, level = 0, nodes }: MenuTreeProps) {
    const currentNodes = nodes || rootNodes;

    const handleLeafToggle = (label: string) => {
        const next = new Set(checkedKeys);
        if (next.has(label)) next.delete(label);
        else next.add(label);
        recomputeAncestors(rootNodes, next);
        onChange(Array.from(next));
    };

    const handleParentToggle = (node: MenuNode) => {
        const next = new Set(checkedKeys);
        const leafKeys = getLeafKeys([node]);
        const allChecked = leafKeys.every((k) => next.has(k));
        if (allChecked) {
            leafKeys.forEach((k) => next.delete(k));
        } else {
            leafKeys.forEach((k) => next.add(k));
        }
        recomputeAncestors(rootNodes, next);
        onChange(Array.from(next));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: level >= 2 ? 8 : 4 }}>
            {currentNodes.map((node) => {
                if (isLeafNode(node)) {
                    return (
                        <Checkbox
                            key={node.label}
                            checked={checkedKeys.includes(node.label)}
                            onChange={() => handleLeafToggle(node.label)}
                        >
                            {node.label}
                        </Checkbox>
                    );
                }

                const allChildrenAreLeaves = node.children!.every(isLeafNode);
                return (
                    <div key={node.label}>
                        <div style={{ marginBottom: allChildrenAreLeaves && level >= 1 ? 8 : 4 }}>
                            <Checkbox
                                indeterminate={isNodeIndeterminate(node, checkedKeys)}
                                checked={isNodeFullyChecked(node, checkedKeys)}
                                onChange={() => handleParentToggle(node)}
                            >
                                <span style={{ fontWeight: level === 0 ? 600 : 500 }}>{node.label}</span>
                            </Checkbox>
                        </div>
                        {allChildrenAreLeaves ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', paddingLeft: 24 }}>
                                {node.children!.map((child) => (
                                    <Checkbox
                                        key={child.label}
                                        checked={checkedKeys.includes(child.label)}
                                        onChange={() => handleLeafToggle(child.label)}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        {child.label}
                                    </Checkbox>
                                ))}
                            </div>
                        ) : (
                            <div style={{ paddingLeft: 24 }}>
                                <MenuTree
                                    rootNodes={rootNodes}
                                    nodes={node.children!}
                                    checkedKeys={checkedKeys}
                                    onChange={onChange}
                                    level={level + 1}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

 export default function RolePage() {
    const [roles, setRoles] = useState<Role[]>(initialRoles);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'system' | 'custom'>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [form, setForm] = useState<Partial<Role>>({});
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailId, setDetailId] = useState<string | null>(null);

    const [roleUsers, setRoleUsers] = useState<Record<string, string[]>>({
        r1: ['张三', '李四'],
        r2: ['王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二', '李十三', '张十四', '刘十五', '陈十六'],
        r3: ['吴一', '郑二', '王三', '赵四', '钱五', '孙六'],
        r4: ['周七', '吴八', '郑九', '王十'],
        r5: ['李一', '张二', '刘三', '陈四', '周五'],
        r6: ['赵五', '钱六', '孙七'],
        r7: [],
    });

    const [permDrawerOpen, setPermDrawerOpen] = useState(false);
    const [permDrawerRoleId, setPermDrawerRoleId] = useState<string | null>(null);
    const [permTab, setPermTab] = useState('operate');
    const [permMenuType, setPermMenuType] = useState<'web' | 'app'>('web');
    const [webCheckedKeys, setWebCheckedKeys] = useState<string[]>([]);
    const [appCheckedKeys, setAppCheckedKeys] = useState<string[]>([]);
    const [customScope, setCustomScope] = useState<string[]>([]);
    const [memberPage, setMemberPage] = useState(1);
    const memberPageSize = 10;
    const [userPickerOpen, setUserPickerOpen] = useState(false);
    const [userPickerSelected, setUserPickerSelected] = useState<string[]>([]);
    const [userPickerSearch, setUserPickerSearch] = useState('');
    const [userPickerExpanded, setUserPickerExpanded] = useState<string[]>(allExpandableKeys);
    const [disableModalOpen, setDisableModalOpen] = useState(false);
    const [disableReason, setDisableReason] = useState('');
    const [copying, setCopying] = useState(false);

    const [selectedFieldRules, setSelectedFieldRules] = useState<string[]>([]);
    const [fieldOverrides, setFieldOverrides] = useState<Record<string, Record<string, FieldOverrideItem>>>({});
    const [expandedRules, setExpandedRules] = useState<string[]>([]);

    const [selectedDataPolicies, setSelectedDataPolicies] = useState<string[]>([]);
    const [policyParams, setPolicyParams] = useState<Record<string, any>>({});

    const [conditionModalOpen, setConditionModalOpen] = useState(false);
    const [conditionEditingRuleId, setConditionEditingRuleId] = useState<string | null>(null);
    const [conditionEditingFieldName, setConditionEditingFieldName] = useState<string | null>(null);
    const [conditionEditingId, setConditionEditingId] = useState<string | null>(null);
    const [conditionForm] = Form.useForm();

    const filtered = roles.filter((r) => {
        const text = `${r.name}${r.code}${r.description}`.toLowerCase();
        return text.includes(search.toLowerCase()) && (typeFilter === 'all' || r.type === typeFilter);
    });

    const selected = roles.find((r) => r.id === detailId) || null;
    const permRole = roles.find((r) => r.id === permDrawerRoleId) || null;

    const openAdd = () => {
        setModalMode('add');
        setForm({ type: 'custom', status: 'active', permissions: [], userCount: 0 });
        setModalOpen(true);
    };

    const openEdit = (id: string) => {
        const r = roles.find((x) => x.id === id);
        if (!r) return;
        setModalMode('edit');
        setForm({ ...r });
        setModalOpen(true);
    };

    const handleSave = () => {
        if (modalMode === 'add') {
            const newRole: Role = { ...(form as Role), id: `r${Date.now()}` };
            setRoles([...roles, newRole]);
            message.success('新增角色成功');
        } else if (form.id) {
            setRoles(roles.map((r) => (r.id === form.id ? { ...r, ...form } as Role : r)));
            message.success('编辑角色成功');
        }
        setModalOpen(false);
    };

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: '确定删除该角色？',
            onOk: () => {
                setRoles(roles.filter((r) => r.id !== id));
                message.success('删除成功');
            },
        });
    };

    const toggleStatus = (id: string) => {
        setRoles(roles.map((r) => (r.id === id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } as Role : r)));
    };

    const openPermDrawer = (id: string, tab?: string) => {
        setPermDrawerRoleId(id);
        const r = roles.find((x) => x.id === id);
        if (r) {
            setSelectedFieldRules(Object.keys(r.fieldRuleOverrides || {}));
            setFieldOverrides(r.fieldRuleOverrides || {});
            setExpandedRules(Object.keys(r.fieldRuleOverrides || {}));
            setSelectedDataPolicies(r.dataPolicyInstances?.map((i) => i.policyId) || []);
            const params: Record<string, any> = {};
            r.dataPolicyInstances?.forEach((i) => {
                params[i.policyId] = i.params;
            });
            setPolicyParams(params);
        } else {
            setSelectedFieldRules([]);
            setFieldOverrides({});
            setExpandedRules([]);
            setSelectedDataPolicies([]);
            setPolicyParams({});
        }
        if (tab) setPermTab(tab);
        setPermDrawerOpen(true);
    };

    const columns: ColumnsType<Role> = [
        {
            title: '角色名称',
            render: (_, r) => (
                <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{r.description}</div>
                </div>
            ),
        },
        {
            title: '编码',
            dataIndex: 'code',
            render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{v}</span>,
        },
        {
            title: '类型',
            dataIndex: 'type',
            render: (v: string) => (
                <Tag color={v === 'system' ? 'blue' : ''} style={{ fontSize: 11 }}>
                    {v === 'system' ? '系统内置' : '业务自定义'}
                </Tag>
            ),
        },
        {
            title: '继承自',
            dataIndex: 'parentName',
            render: (v) => v || '-',
        },
        {
            title: '使用人数',
            dataIndex: 'userCount',
            render: (v: number, r) => (
                <Button type="link" size="small" onClick={(e) => {
                    e.stopPropagation();
                    openPermDrawer(r.id, 'members');
                }}>
                    {v}
                </Button>
            ),
        },
        {
            title: '有效期',
            dataIndex: 'expiryDate',
            render: (v) => v ? <span style={{ color: '#ff4d4f' }}><Clock size={12} /> {v}</span> : '永久',
        },
        {
            title: '状态',
            dataIndex: 'status',
            render: (v: string) => (
                <Tag color={v === 'active' ? 'success' : 'error'} style={{ fontSize: 11 }}>
                    {v === 'active' ? '已启用' : '已停用'}
                </Tag>
            ),
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            render: (_, r) => (
                <Space size="small">
                    {r.type !== 'system' && <Button type="link" size="small" onClick={() => openEdit(r.id)}>编辑</Button>}
                    {r.type !== 'system' && (
                        <Button type="link" size="small" onClick={() => {
                            if (r.status === 'active') {
                                setPermDrawerRoleId(r.id);
                                setDisableReason('');
                                setDisableModalOpen(true);
                            } else if (confirm('确定启用该角色？')) {
                                setRoles(roles.map((x) => x.id === r.id ? { ...x, status: 'active' as const } : x));
                            }
                        }}>
                            {r.status === 'active' ? '停用' : '启用'}
                        </Button>
                    )}
                    {r.type !== 'system' && <Button type="link" size="small" onClick={() => openPermDrawer(r.id)}>设置权限</Button>}
                    {r.type !== 'system' && (
                        <Button type="link" size="small" onClick={() => {
                            setCopying(true);
                            setTimeout(() => {
                                setCopying(false);
                                message.success('复制成功');
                            }, 1500);
                        }}>复制</Button>
                    )}
                    {r.type !== 'system' && r.userCount === 0 && (
                        <Button type="link" size="small" danger onClick={() => handleDelete(r.id)}>删除</Button>
                    )}
                </Space>
            ),
        },
    ];

    const members = roleUsers[permDrawerRoleId || ''] || [];
    const pagedMembers = members.slice((memberPage - 1) * memberPageSize, memberPage * memberPageSize);

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Button type="primary" icon={<Plus size={14} />} onClick={openAdd}>新增角色</Button>
                <div style={{ flex: 1 }} />
                <Select
                    value={typeFilter}
                    style={{ width: 120 }}
                    onChange={(v) => setTypeFilter(v)}
                    options={[
                        { value: 'all', label: '全部类型' },
                        { value: 'system', label: '系统内置' },
                        { value: 'custom', label: '业务自定义' },
                    ]}
                />
                <Input.Search
                    placeholder="搜索角色..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 200 }}
                    allowClear
                />
            </div>

            <div data-annotation-id="role-table" className="admin-card" style={{ padding: 0 }}>
                <Table rowKey="id" columns={columns} dataSource={filtered} pagination={false} />
                {filtered.length === 0 && <div className="admin-empty">未找到匹配的角色</div>}
            </div>

            <Modal
                open={modalOpen}
                title={modalMode === 'add' ? '新增角色' : '编辑角色'}
                onCancel={() => setModalOpen(false)}
                onOk={handleSave}
            >
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="角色名称" required>
                                <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="角色编码" required>
                                <Input value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="类型">
                                <Select value="custom" disabled options={[{ value: 'custom', label: '业务自定义' }]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="继承角色">
                                <Select
                                    value={form.parentId || ''}
                                    onChange={(id) => {
                                        const parent = roles.find((x) => x.id === id);
                                        setForm({ ...form, parentId: id || undefined, parentName: parent?.name });
                                    }}
                                    placeholder="无"
                                    allowClear
                                    options={[{ value: '', label: '无' }, ...roles.filter((x) => x.id !== form.id).map((r) => ({ value: r.id, label: r.name }))]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="描述">
                        <Input.TextArea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="有效期至">
                                <Input type="date" value={form.expiryDate || ''} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            <Modal
                open={detailOpen}
                title="角色详情"
                onCancel={() => setDetailOpen(false)}
                footer={null}
                width={560}
            >
                {selected && (
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>角色名称</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{selected.name}</div>
                        </Col>
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>编码</div>
                            <div style={{ fontSize: 14, fontFamily: 'monospace' }}>{selected.code}</div>
                        </Col>
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>类型</div>
                            <Tag color={selected.type === 'system' ? 'blue' : ''}>{selected.type === 'system' ? '系统内置' : '业务自定义'}</Tag>
                        </Col>
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>状态</div>
                            <Tag color={selected.status === 'active' ? 'success' : 'error'}>{selected.status === 'active' ? '已启用' : '已停用'}</Tag>
                        </Col>
                        {selected.parentName && (
                            <Col span={12}>
                                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>继承自</div>
                                <div style={{ fontSize: 14 }}>{selected.parentName}</div>
                            </Col>
                        )}
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>使用人数</div>
                            <div style={{ fontSize: 14 }}>{selected.userCount} 人</div>
                        </Col>
                        {selected.expiryDate && (
                            <Col span={12}>
                                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>有效期至</div>
                                <div style={{ fontSize: 14, color: '#ff4d4f' }}>{selected.expiryDate}</div>
                            </Col>
                        )}
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>数据范围</div>
                            <div style={{ fontSize: 14 }}>{selected.dataScopeRule || '-'}</div>
                        </Col>
                        <Col span={24}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>权限清单</div>
                            <Space size={8} wrap>
                                {selected.permissions.map((p) => (
                                    <Tag key={p} color="blue" style={{ fontSize: 12 }}>{p}</Tag>
                                ))}
                            </Space>
                        </Col>
                        {selected.fieldRules && selected.fieldRules.length > 0 && (
                            <Col span={24}>
                                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>字段权限规则</div>
                                <Space size={8} wrap>
                                    {selected.fieldRules.map((f) => (
                                        <Tag key={f} color="orange" style={{ fontSize: 12 }}>{f}</Tag>
                                    ))}
                                </Space>
                            </Col>
                        )}
                        {selected.dataPolicyInstances && selected.dataPolicyInstances.length > 0 && (
                            <Col span={24}>
                                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>数据权限策略</div>
                                <Space size={8} wrap>
                                    {selected.dataPolicyInstances.map((i) => {
                                        const policy = allDataPolicies.find((p) => p.id === i.policyId);
                                        return (
                                            <Tag key={i.policyId} color="purple" style={{ fontSize: 12 }}>
                                                {policy?.name || i.policyId}
                                                {Object.keys(i.params).length > 0 && ` (${JSON.stringify(i.params)})`}
                                            </Tag>
                                        );
                                    })}
                                </Space>
                            </Col>
                        )}
                        {selected.fieldRuleOverrides && Object.keys(selected.fieldRuleOverrides).length > 0 && (
                            <Col span={24}>
                                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>字段权限覆盖</div>
                                <Space size={8} wrap>
                                    {Object.entries(selected.fieldRuleOverrides).map(([ruleId, overrides]) => {
                                        const rule = allFieldRules.find((r) => r.id === ruleId);
                                        const overrideCount = Object.keys(overrides).length;
                                        return (
                                            <Tag key={ruleId} color="orange" style={{ fontSize: 12 }}>
                                                {rule?.name || ruleId} ({overrideCount}条覆盖)
                                            </Tag>
                                        );
                                    })}
                                </Space>
                            </Col>
                        )}
                    </Row>
                )}
            </Modal>

            <Modal
                open={userPickerOpen}
                title="选择人员"
                onCancel={() => setUserPickerOpen(false)}
                onOk={() => {
                    if (!permDrawerRoleId) return;
                    const current = roleUsers[permDrawerRoleId] || [];
                    const newUsers = userPickerSelected.filter((u) => !current.includes(u));
                    setRoleUsers((prev) => ({ ...prev, [permDrawerRoleId]: [...current, ...newUsers] }));
                    setRoles((prev) => prev.map((r) => r.id === permDrawerRoleId ? { ...r, userCount: r.userCount + newUsers.length } : r));
                    setUserPickerOpen(false);
                }}
                width={600}
            >
                <div style={{ display: 'flex', gap: 16, minHeight: 360 }}>
                    <div style={{ flex: 1, overflow: 'auto', maxHeight: 400 }}>
                        <div style={{ fontSize: 13, color: '#1677ff', marginBottom: 8 }}>用户列表</div>
                        <Input.Search
                            placeholder="搜索人员或组织..."
                            value={userPickerSearch}
                            onChange={(e) => {
                                setUserPickerSearch(e.target.value);
                                if (e.target.value) {
                                    setUserPickerExpanded(collectExpandedKeys(pickerTreeData, e.target.value));
                                } else {
                                    setUserPickerExpanded(allExpandableKeys);
                                }
                            }}
                            onSearch={() => {}}
                            allowClear
                            style={{ marginBottom: 8 }}
                        />
                        <Tree
                            checkable
                            expandedKeys={userPickerExpanded}
                            onExpand={(keys) => setUserPickerExpanded(keys as string[])}
                            treeData={filterTreeData(pickerTreeData, userPickerSearch)}
                            checkedKeys={[
                                ...userPickerSelected,
                                ...getParentKeys(pickerTreeData, userPickerSelected),
                            ]}
                            onCheck={(checked) => {
                                const keys = checked as string[];
                                setUserPickerSelected(keys.filter((k) => allPickerUserKeys.includes(k)));
                            }}
                        />
                    </div>
                    <div style={{ width: 200 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>已选择（{userPickerSelected.length}）</div>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {userPickerSelected.map((u) => (
                                <Tag key={u} closable onClose={() => setUserPickerSelected((prev) => prev.filter((x) => x !== u))}>{u}</Tag>
                            ))}
                            {userPickerSelected.length === 0 && <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.25)' }}>暂未选择</div>}
                        </Space>
                    </div>
                </div>
            </Modal>

            <Drawer
                open={permDrawerOpen}
                title="设置角色权限"
                width="66vw"
                onClose={() => setPermDrawerOpen(false)}
                styles={{ body: { padding: 0, overflow: 'hidden' } }}
                footer={
                    <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                        <Button onClick={() => setPermDrawerOpen(false)}>取消</Button>
                        <Button type="primary" icon={<Save size={14} />} onClick={() => {
                            if (permDrawerRoleId) {
                                const instances: DataPolicyInstance[] = selectedDataPolicies.map((pid) => ({
                                    policyId: pid,
                                    params: policyParams[pid] || {},
                                }));
                                setRoles((prev) => prev.map((r) => {
                                    if (r.id !== permDrawerRoleId) return r;
                                    return {
                                        ...r,
                                        fieldRuleOverrides: { ...fieldOverrides },
                                        dataPolicyInstances: instances,
                                    };
                                }));
                                message.success('权限设置已保存');
                            }
                            setPermDrawerOpen(false);
                        }}>保存</Button>
                    </Space>
                }
            >
                {permRole && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '16px 24px', padding: 16, background: '#fafafa', borderRadius: 8 }}>
                            <Avatar size={48} style={{ backgroundColor: '#ff6b00' }}><Users size={24} /></Avatar>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 16, fontWeight: 600 }}>{permRole.name}</div>
                                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>{permRole.description || '暂无相关描述'}</div>
                            </div>
                            <Space wrap>
                                <Button size="small" icon={<UserPlus size={12} />} onClick={() => {
                                    setUserPickerSelected([]);
                                    setUserPickerSearch('');
                                    setUserPickerExpanded(allExpandableKeys);
                                    setUserPickerOpen(true);
                                }}>添加人员</Button>
                                {permRole.type !== 'system' && (
                                    <Button size="small" icon={<Pencil size={12} />} onClick={() => {
                                        if (!permDrawerRoleId) return;
                                        const r = roles.find((x) => x.id === permDrawerRoleId);
                                        if (!r) return;
                                        setModalMode('edit');
                                        setForm({ ...r });
                                        setModalOpen(true);
                                    }}>编辑角色</Button>
                                )}
                                {permRole.type !== 'system' && (
                                    <Button size="small" icon={<Clock size={12} />} onClick={() => {
                                        if (permRole.status === 'active') {
                                            setDisableReason('');
                                            setDisableModalOpen(true);
                                        } else if (confirm('确定启用该角色？')) {
                                            setRoles((prev) => prev.map((r) => r.id === permDrawerRoleId ? { ...r, status: 'active' as const } : r));
                                        }
                                    }}>
                                        {permRole.status === 'active' ? '停用角色' : '启用角色'}
                                    </Button>
                                )}
                                <Button size="small" icon={<Layers size={12} />} disabled={copying} onClick={() => {
                                    if (!permDrawerRoleId) return;
                                    setCopying(true);
                                    setTimeout(() => {
                                        setCopying(false);
                                        message.success('复制成功');
                                    }, 1500);
                                }}>复制角色</Button>
                                {permRole.type !== 'system' && (
                                    <Button size="small" danger icon={<Trash2 size={12} />} onClick={() => {
                                        if (!permDrawerRoleId) return;
                                        const r = roles.find((x) => x.id === permDrawerRoleId);
                                        if (!r) return;
                                        if (r.userCount > 0) {
                                            message.error('该角色下存在成员，不允许删除');
                                        } else if (confirm('确定删除该角色？')) {
                                            setRoles((prev) => prev.filter((x) => x.id !== permDrawerRoleId));
                                            setPermDrawerOpen(false);
                                        }
                                    }}>删除角色</Button>
                                )}
                            </Space>
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                        <Tabs className="perm-tabs" activeKey={permTab} onChange={(k) => setPermTab(k)} items={[
                            {
                                key: 'operate',
                                label: '功能权限',
                                children: (
                                    <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 300px)', padding: '0 24px 24px' }}>
                                        <Space style={{ marginBottom: 16 }}>
                                            <Button type={permMenuType === 'web' ? 'primary' : 'default'} size="small" onClick={() => setPermMenuType('web')}>WEB菜单权限</Button>
                                            <Button type={permMenuType === 'app' ? 'primary' : 'default'} size="small" onClick={() => setPermMenuType('app')}>APP菜单权限</Button>
                                        </Space>
                                        <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16 }}>
                                            <MenuTree
                                                rootNodes={permMenuType === 'web' ? webMenuTree : appMenuTree}
                                                checkedKeys={permMenuType === 'web' ? webCheckedKeys : appCheckedKeys}
                                                onChange={(keys) => {
                                                    if (permMenuType === 'web') setWebCheckedKeys(keys);
                                                    else setAppCheckedKeys(keys);
                                                }}
                                            />
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: 'data',
                                label: '数据权限',
                                children: (
                                    <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 300px)', padding: '0 24px 24px' }}>
                                        <div style={{ marginBottom: 16 }}>
                                            <span style={{ fontSize: 14, fontWeight: 600 }}>数据权限策略</span>
                                            <span style={{ marginLeft: 8, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                                                勾选策略后，如策略需要参数，请填写具体参数值
                                            </span>
                                        </div>
                                        {allDataPolicies.filter((p) => p.status === 'active').map((policy) => {
                                            const isParametrized = isPolicyParametrized(policy);
                                            const isSelected = selectedDataPolicies.includes(policy.id);
                                            return (
                                                <div key={policy.id} style={{ border: '1px solid #f0f0f0', borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
                                                    <div style={{ padding: '12px 16px', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedDataPolicies((prev) => [...prev, policy.id]);
                                                                } else {
                                                                    setSelectedDataPolicies((prev) => prev.filter((id) => id !== policy.id));
                                                                    setPolicyParams((prev) => {
                                                                        const next = { ...prev };
                                                                        delete next[policy.id];
                                                                        return next;
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 600, fontSize: 14 }}>
                                                                {policy.name}
                                                                <Tag style={{ marginLeft: 8, fontSize: 11 }}>{typeMap[policy.type]}</Tag>
                                                                {isParametrized && <Tag color="orange" style={{ fontSize: 11 }}>需参数</Tag>}
                                                            </div>
                                                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                                                                {policy.description}
                                                            </div>
                                                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>
                                                                适用对象：{policy.entities.join('、')}
                                                            </div>
                                                        </div>
                                                        <Tag color="blue">{policy.code}</Tag>
                                                    </div>
                                                    {isSelected && isParametrized && (
                                                        <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
                                                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                                                                策略参数配置
                                                            </div>
                                                            {policy.type === 'org' && policy.ruleConfig?.baseScope === 'specified' && (
                                                                <Form.Item label="指定组织" layout="vertical" style={{ marginBottom: 0 }}>
                                                                    <Select
                                                                        mode="multiple"
                                                                        style={{ width: '100%' }}
                                                                        placeholder="请选择具体组织"
                                                                        value={policyParams[policy.id]?.orgIds || []}
                                                                        onChange={(vals) => {
                                                                            setPolicyParams((prev) => ({
                                                                                ...prev,
                                                                                [policy.id]: { ...(prev[policy.id] || {}), orgIds: vals },
                                                                            }));
                                                                        }}
                                                                        options={orgTreeOptions.map((o) => ({ value: o.id, label: o.name }))}
                                                                    />
                                                                </Form.Item>
                                                            )}
                                                            {policy.type === 'dimension' && (
                                                                <Form.Item label="维度值" layout="vertical" style={{ marginBottom: 0 }}>
                                                                    <Select
                                                                        mode="multiple"
                                                                        style={{ width: '100%' }}
                                                                        placeholder={`请选择${policy.ruleConfig?.dimensionType || '维度'}值`}
                                                                        value={policyParams[policy.id]?.dimensionValues || []}
                                                                        onChange={(vals) => {
                                                                            setPolicyParams((prev) => ({
                                                                                ...prev,
                                                                                [policy.id]: { ...(prev[policy.id] || {}), dimensionValues: vals },
                                                                            }));
                                                                        }}
                                                                        options={['窑线', '磨线', '包装线', '原料线'].map((d) => ({ value: d, label: d }))}
                                                                    />
                                                                </Form.Item>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {allDataPolicies.filter((p) => p.status === 'active').length === 0 && (
                                            <div className="admin-empty" style={{ padding: 40 }}>暂无启用的数据权限策略</div>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: 'field',
                                label: '字段权限',
                                children: (
                                    <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 300px)', padding: '0 24px 24px' }}>
                                        <div style={{ marginBottom: 16 }}>
                                            <span style={{ fontSize: 14, fontWeight: 600 }}>字段权限规则</span>
                                            <span style={{ marginLeft: 8, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                                                勾选规则并开启覆盖后，可修改该字段的默认权限、条件权限及脱敏规则
                                            </span>
                                        </div>
                                        {allFieldRules.filter((r) => r.status === 'active').map((rule) => {
                                            const isSelected = selectedFieldRules.includes(rule.id);
                                            const isExpanded = expandedRules.includes(rule.id);
                                            const overrideCount = isSelected ? Object.keys(fieldOverrides[rule.id] || {}).length : 0;
                                            const hasOverride = isSelected && overrideCount > 0;
                                            return (
                                                <div key={rule.id} style={{ border: '1px solid #f0f0f0', borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
                                                    <div
                                                        style={{ padding: '12px 16px', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 12, cursor: isSelected ? 'pointer' : 'default' }}
                                                        onClick={() => {
                                                            if (!isSelected) return;
                                                            setExpandedRules((prev) =>
                                                                prev.includes(rule.id) ? prev.filter((id) => id !== rule.id) : [...prev, rule.id]
                                                            );
                                                        }}
                                                    >
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedFieldRules((prev) => [...prev, rule.id]);
                                                                    setExpandedRules((prev) => [...prev, rule.id]);
                                                                } else {
                                                                    setSelectedFieldRules((prev) => prev.filter((id) => id !== rule.id));
                                                                    setExpandedRules((prev) => prev.filter((id) => id !== rule.id));
                                                                    setFieldOverrides((prev) => {
                                                                        const next = { ...prev };
                                                                        delete next[rule.id];
                                                                        return next;
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                {rule.name}
                                                                {hasOverride && <Tag color="orange" style={{ fontSize: 11 }}>已覆盖 {overrideCount}/{rule.fieldConfigs.length}</Tag>}
                                                            </div>
                                                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                                                                {rule.entity} · {rule.fieldConfigs.length} 个字段
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <span style={{ fontSize: 12, color: '#1677ff' }}>
                                                                {isExpanded ? '收起' : '展开'}
                                                            </span>
                                                        )}
                                                        <Tag color="blue">{rule.code}</Tag>
                                                    </div>
                                                    {isSelected && isExpanded && (
                                                        <div style={{ padding: 12 }}>
                                                            <Table
                                                                size="small"
                                                                pagination={false}
                                                                rowKey="fieldName"
                                                                dataSource={rule.fieldConfigs}
                                                                columns={[
                                                                    { title: '字段名称', dataIndex: 'fieldLabel', render: (v: string, rc: FieldConfig) => (
                                                                        <div>
                                                                            <div style={{ fontWeight: 500 }}>{v}</div>
                                                                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{rc.fieldName}</div>
                                                                        </div>
                                                                    )},
                                                                    { title: '字段类型', dataIndex: 'fieldType', width: 80 },
                                                                    {
                                                                        title: '默认权限',
                                                                        dataIndex: 'defaultPermission',
                                                                        width: 120,
                                                                        render: (v: FieldPermissionType, rc: FieldConfig) => {
                                                                            const override = fieldOverrides[rule.id]?.[rc.fieldName];
                                                                            const enabled = !!override;
                                                                            return enabled ? (
                                                                                <Select
                                                                                    size="small"
                                                                                    style={{ width: 90 }}
                                                                                    value={override.defaultPermission}
                                                                                    onChange={(val) => {
                                                                                        setFieldOverrides((prev) => ({
                                                                                            ...prev,
                                                                                            [rule.id]: {
                                                                                                ...(prev[rule.id] || {}),
                                                                                                [rc.fieldName]: { ...override, defaultPermission: val },
                                                                                            },
                                                                                        }));
                                                                                    }}
                                                                                    options={[
                                                                                        { value: 'hidden', label: '隐藏' },
                                                                                        { value: 'readonly', label: '只读' },
                                                                                        { value: 'editable', label: '可编辑' },
                                                                                    ]}
                                                                                />
                                                                            ) : (
                                                                                <Tag color={PERMISSION_COLOR[v]}>{PERMISSION_LABEL[v]}</Tag>
                                                                            );
                                                                        },
                                                                    },
                                                                    {
                                                                        title: '条件权限',
                                                                        key: 'conditions',
                                                                        width: 220,
                                                                        render: (_: any, rc: FieldConfig) => {
                                                                            const override = fieldOverrides[rule.id]?.[rc.fieldName];
                                                                            const enabled = !!override;
                                                                            const conds = enabled ? override.conditions : rc.conditions;
                                                                            return (
                                                                                <div>
                                                                                    {conds.length === 0 && <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.25)' }}>-</span>}
                                                                                    {conds.map((c: ConditionPermission) => (
                                                                                        <div key={c.id} style={{ fontSize: 12, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                                            <Tag color="blue" style={{ fontSize: 11 }}>{c.priority}</Tag>
                                                                                            <span style={{ color: 'rgba(0,0,0,0.65)', flex: 1 }}>{CONDITION_TYPE_LABEL[c.conditionType]} → {PERMISSION_LABEL[c.permission]}</span>
                                                                                            {enabled && (
                                                                                                <>
                                                                                                    <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }} onClick={() => {
                                                                                                        setConditionEditingRuleId(rule.id);
                                                                                                        setConditionEditingFieldName(rc.fieldName);
                                                                                                        setConditionEditingId(c.id);
                                                                                                        conditionForm.setFieldsValue({
                                                                                                            name: c.name,
                                                                                                            conditionType: c.conditionType,
                                                                                                            permission: c.permission,
                                                                                                            priority: c.priority,
                                                                                                            config: c.config,
                                                                                                        });
                                                                                                        setConditionModalOpen(true);
                                                                                                    }}>编辑</Button>
                                                                                                    <Button type="link" size="small" danger style={{ padding: 0, fontSize: 12 }} onClick={() => {
                                                                                                        setFieldOverrides((prev) => {
                                                                                                            const ruleOverrides = prev[rule.id] || {};
                                                                                                            const fieldOverride = ruleOverrides[rc.fieldName];
                                                                                                            if (!fieldOverride) return prev;
                                                                                                            const nextConditions = fieldOverride.conditions.filter((cc: ConditionPermission) => cc.id !== c.id);
                                                                                                            if (nextConditions.length === 0 && !fieldOverride.defaultPermission && !fieldOverride.maskingRule) {
                                                                                                                const nextRule = { ...ruleOverrides };
                                                                                                                delete nextRule[rc.fieldName];
                                                                                                                const next = { ...prev, [rule.id]: nextRule };
                                                                                                                if (Object.keys(nextRule).length === 0) {
                                                                                                                    delete next[rule.id];
                                                                                                                }
                                                                                                                return next;
                                                                                                            }
                                                                                                            return {
                                                                                                                ...prev,
                                                                                                                [rule.id]: {
                                                                                                                    ...ruleOverrides,
                                                                                                                    [rc.fieldName]: { ...fieldOverride, conditions: nextConditions },
                                                                                                                },
                                                                                                            };
                                                                                                        });
                                                                                                        message.success('条件已删除');
                                                                                                    }}>删除</Button>
                                                                                                </>
                                                                                            )}
                                                                                        </div>
                                                                                    ))}
                                                                                    {enabled && (
                                                                                        <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }} onClick={() => {
                                                                                            setConditionEditingRuleId(rule.id);
                                                                                            setConditionEditingFieldName(rc.fieldName);
                                                                                            setConditionEditingId(null);
                                                                                            conditionForm.resetFields();
                                                                                            setConditionModalOpen(true);
                                                                                        }}>添加条件</Button>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        },
                                                                    },
                                                                    {
                                                                        title: '脱敏规则',
                                                                        dataIndex: 'maskingRule',
                                                                        width: 130,
                                                                        render: (v: MaskingType, rc: FieldConfig) => {
                                                                            const override = fieldOverrides[rule.id]?.[rc.fieldName];
                                                                            const enabled = !!override;
                                                                            return enabled ? (
                                                                                <Select
                                                                                    size="small"
                                                                                    style={{ width: 100 }}
                                                                                    value={override.maskingRule}
                                                                                    onChange={(val) => {
                                                                                        setFieldOverrides((prev) => ({
                                                                                            ...prev,
                                                                                            [rule.id]: {
                                                                                                ...(prev[rule.id] || {}),
                                                                                                [rc.fieldName]: { ...override, maskingRule: val },
                                                                                            },
                                                                                        }));
                                                                                    }}
                                                                                    options={[
                                                                                        { value: 'none', label: '无' },
                                                                                        { value: 'phone', label: '手机号脱敏' },
                                                                                        { value: 'idCard', label: '身份证脱敏' },
                                                                                        { value: 'custom', label: '自定义正则' },
                                                                                    ]}
                                                                                />
                                                                            ) : (
                                                                                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>{MASKING_LABEL[v]}</span>
                                                                            );
                                                                        },
                                                                    },
                                                                    {
                                                                        title: '覆盖',
                                                                        key: 'overrideSwitch',
                                                                        width: 80,
                                                                        align: 'center',
                                                                        render: (_, rc: FieldConfig) => {
                                                                            const enabled = !!fieldOverrides[rule.id]?.[rc.fieldName];
                                                                            return (
                                                                                <Switch
                                                                                    size="small"
                                                                                    checked={enabled}
                                                                                    onChange={(checked) => {
                                                                                        if (checked) {
                                                                                            setFieldOverrides((prev) => ({
                                                                                                ...prev,
                                                                                                [rule.id]: {
                                                                                                    ...(prev[rule.id] || {}),
                                                                                                    [rc.fieldName]: {
                                                                                                        defaultPermission: rc.defaultPermission,
                                                                                                        conditions: rc.conditions.map((c) => ({ ...c })),
                                                                                                        maskingRule: rc.maskingRule,
                                                                                                        maskingCustom: rc.maskingCustom,
                                                                                                    },
                                                                                                },
                                                                                            }));
                                                                                        } else {
                                                                                            setFieldOverrides((prev) => {
                                                                                                const next = { ...prev };
                                                                                                if (next[rule.id]) {
                                                                                                    const ruleNext = { ...next[rule.id] };
                                                                                                    delete ruleNext[rc.fieldName];
                                                                                                    if (Object.keys(ruleNext).length === 0) {
                                                                                                        delete next[rule.id];
                                                                                                    } else {
                                                                                                        next[rule.id] = ruleNext;
                                                                                                    }
                                                                                                }
                                                                                                return next;
                                                                                            });
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            );
                                                                        },
                                                                    },
                                                                ]}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {allFieldRules.filter((r) => r.status === 'active').length === 0 && (
                                            <div className="admin-empty" style={{ padding: 40 }}>暂无启用的字段权限规则</div>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: 'members',
                                label: '成员列表',
                                children: (
                                    <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 300px)', padding: '0 24px 24px' }}>
                                        <Table
                                            rowKey={(r, i) => String(i)}
                                            columns={[
                                                { title: '姓名', dataIndex: 'name' },
                                                { title: '部门', dataIndex: 'dept' },
                                                { title: '加入时间', dataIndex: 'joinTime' },
                                                {
                                                    title: '操作',
                                                    key: 'action',
                                                    render: (_, __, idx) => {
                                                        const realIdx = (memberPage - 1) * memberPageSize + idx;
                                                        return (
                                                            <Button type="link" size="small" danger onClick={() => {
                                                                if (!permDrawerRoleId) return;
                                                                setRoleUsers((prev) => ({ ...prev, [permDrawerRoleId]: prev[permDrawerRoleId].filter((_, i) => i !== realIdx) }));
                                                                setRoles((prev) => prev.map((r) => r.id === permDrawerRoleId ? { ...r, userCount: Math.max(0, r.userCount - 1) } : r));
                                                            }}>移除</Button>
                                                        );
                                                    },
                                                },
                                            ]}
                                            dataSource={pagedMembers.map((name) => ({ name, dept: '销售部', joinTime: '2019-08-25 14:54' }))}
                                            pagination={false}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                                            <Pagination
                                                current={memberPage}
                                                pageSize={memberPageSize}
                                                total={members.length}
                                                onChange={(p) => setMemberPage(p)}
                                                showSizeChanger={false}
                                            />
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: 'log',
                                label: '操作记录',
                                children: <div className="admin-empty" style={{ padding: 40, overflow: 'auto', maxHeight: 'calc(100vh - 300px)' }}>操作记录（占位）</div>,
                            },
                        ]} />
                        </div>
                    </div>
                )}
            </Drawer>

            <Modal
                open={conditionModalOpen}
                title={conditionEditingId ? '编辑条件权限' : '添加条件权限'}
                onCancel={() => setConditionModalOpen(false)}
                onOk={() => {
                    conditionForm.validateFields().then((values) => {
                        if (!conditionEditingRuleId || !conditionEditingFieldName) return;
                        if (conditionEditingId) {
                            setFieldOverrides((prev) => {
                                const ruleOverrides = prev[conditionEditingRuleId] || {};
                                const fieldOverride = ruleOverrides[conditionEditingFieldName];
                                if (!fieldOverride) return prev;
                                return {
                                    ...prev,
                                    [conditionEditingRuleId]: {
                                        ...ruleOverrides,
                                        [conditionEditingFieldName]: {
                                            ...fieldOverride,
                                            conditions: fieldOverride.conditions.map((cc: ConditionPermission) =>
                                                cc.id === conditionEditingId
                                                    ? { ...cc, name: values.name, conditionType: values.conditionType, config: values.config, permission: values.permission, priority: values.priority || 1 }
                                                    : cc
                                            ),
                                        },
                                    },
                                };
                            });
                            setConditionModalOpen(false);
                            message.success('条件已更新');
                        } else {
                            const newCond: ConditionPermission = {
                                id: `c-${Date.now()}`,
                                name: values.name,
                                conditionType: values.conditionType,
                                config: values.config,
                                permission: values.permission,
                                priority: values.priority || 1,
                            };
                            setFieldOverrides((prev) => {
                                const ruleOverrides = prev[conditionEditingRuleId] || {};
                                const fieldOverride = ruleOverrides[conditionEditingFieldName];
                                if (!fieldOverride) return prev;
                                return {
                                    ...prev,
                                    [conditionEditingRuleId]: {
                                        ...ruleOverrides,
                                        [conditionEditingFieldName]: {
                                            ...fieldOverride,
                                            conditions: [...fieldOverride.conditions, newCond],
                                        },
                                    },
                                };
                            });
                            setConditionModalOpen(false);
                            message.success('条件已添加');
                        }
                    });
                }}
                width={600}
            >
                <Form form={conditionForm} layout="vertical">
                    <Form.Item name="name" label="条件名称">
                        <Input placeholder="可选，用于标识该条件" />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="conditionType" label="条件类型" rules={[{ required: true }]} initialValue="role">
                                <Select options={[
                                    { value: 'userAttr', label: '用户属性匹配' },
                                    { value: 'role', label: '角色匹配' },
                                    { value: 'custom', label: '自定义表达式' },
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="permission" label="满足时权限" rules={[{ required: true }]} initialValue="readonly">
                                <Select options={[
                                    { value: 'hidden', label: '隐藏' },
                                    { value: 'readonly', label: '只读' },
                                    { value: 'editable', label: '可编辑' },
                                ]} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="priority" label="优先级" initialValue={1}>
                        <InputNumber min={1} style={{ width: '100%' }} placeholder="数字越小越优先" />
                    </Form.Item>
                    <Form.Item noStyle shouldUpdate={(prev, cur) => prev.conditionType !== cur.conditionType}>
                        {({ getFieldValue }) => {
                            const type = getFieldValue('conditionType') as ConditionType;
                            if (type === 'role') {
                                return (
                                    <Form.Item name={['config', 'roles']} label="匹配角色" rules={[{ required: true }]}>
                                        <Select mode="multiple" placeholder="选择角色" options={[
                                            '工厂管理员', '生产审批', '车间安全员', '窑系统监控', '生产报表审核', '车间安全管理',
                                            '运输调度查看', '矿山管理', '区域管理员', '集团报表', '销售经理', '财务经理', '客服',
                                        ].map((r) => ({ label: r, value: r }))} />
                                    </Form.Item>
                                );
                            }
                            if (type === 'userAttr') {
                                return (
                                    <Row gutter={16}>
                                        <Col span={8}>
                                            <Form.Item name={['config', 'attr']} label="用户属性" rules={[{ required: true }]}>
                                                <Select placeholder="选择属性" options={[
                                                    { label: '岗位', value: '岗位' },
                                                    { label: '部门', value: '部门' },
                                                    { label: '组织', value: '组织' },
                                                ]} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item name={['config', 'operator']} label="操作符" rules={[{ required: true }]} initialValue="eq">
                                                <Select options={[
                                                    { label: '等于', value: 'eq' },
                                                    { label: '包含', value: 'contains' },
                                                    { label: '属于', value: 'in' },
                                                ]} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item name={['config', 'value']} label="匹配值" rules={[{ required: true }]}>
                                                <Input placeholder="如 总监" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                );
                            }
                            if (type === 'custom') {
                                return (
                                    <Form.Item name={['config', 'expression']} label="自定义表达式" rules={[{ required: true }]}>
                                        <Input.TextArea placeholder="输入条件表达式，如 {user.dept} = '烧成车间'" rows={3} />
                                    </Form.Item>
                                );
                            }
                            return null;
                        }}
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                open={disableModalOpen}
                title="停用角色"
                onCancel={() => setDisableModalOpen(false)}
                onOk={() => {
                    if (!disableReason.trim()) {
                        message.error('请输入停用原因');
                        return;
                    }
                    if (permDrawerRoleId) {
                        setRoles((prev) => prev.map((r) => r.id === permDrawerRoleId ? { ...r, status: 'inactive' as const } : r));
                    }
                    setDisableModalOpen(false);
                    setDisableReason('');
                }}
            >
                <Form layout="vertical">
                    <Form.Item label="角色名称">
                        <Input value={permRole?.name || ''} readOnly />
                    </Form.Item>
                    <Form.Item label="停用原因" required>
                        <Input.TextArea
                            value={disableReason}
                            onChange={(e) => setDisableReason(e.target.value)}
                            placeholder="请输入停用原因"
                            maxLength={300}
                            showCount
                            rows={4}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {copying && (
                <Spin tip="复制中..." size="large" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            )}
        </div>
    );
}
