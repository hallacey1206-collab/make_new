import React, { useState, useMemo } from 'react';
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
    Info,
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
    Pagination,
    message,
    Spin,
    Avatar,
    Tooltip,
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
    userCount: number;
    status: 'active' | 'inactive';
    children?: Role[];
};

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
        dataScopeRule: '仅本级组织',
        userCount: 0,
        status: 'inactive',
    },
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

 type MenuNode = { label: string; isDynamic?: boolean; note?: string; children?: MenuNode[] };

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
                { label: '报修记录' },
                {
                    label: '维修工单管理',
                    children: [
                        { label: '查看列表' },
                        { label: '创建工单' },
                        { label: '导出工单' },
                        {
                            label: '动态按钮组',
                            isDynamic: true,
                            note: '此组按钮的具体显隐由"业务规则-按钮矩阵"控制，此处仅需勾选总开关',
                            children: [
                                { label: '提交审批' },
                                { label: '通过/退回' },
                                { label: '撤销工单' },
                                { label: '发起验收' },
                                { label: '追加物料' },
                                { label: '上传附件' },
                            ],
                        },
                    ],
                },
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
    collapsedGroups?: Set<string>;
    onToggleCollapse?: (label: string) => void;
}

function MenuTree({ rootNodes, checkedKeys, onChange, level = 0, nodes, collapsedGroups, onToggleCollapse }: MenuTreeProps) {
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
                const isDynamic = node.isDynamic === true;
                const isCollapsed = collapsedGroups?.has(node.label) ?? false;

                return (
                    <div key={node.label}>
                        <div style={{ marginBottom: allChildrenAreLeaves && level >= 1 ? 8 : 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Checkbox
                                indeterminate={isNodeIndeterminate(node, checkedKeys)}
                                checked={isNodeFullyChecked(node, checkedKeys)}
                                onChange={() => handleParentToggle(node)}
                            >
                                <span style={{ fontWeight: level === 0 ? 600 : 500 }}>
                                    {isDynamic ? '🔄 ' : ''}{node.label}
                                </span>
                            </Checkbox>
                            {isDynamic && (
                                <Tooltip title={'此组按钮的具体显隐由"业务规则-按钮矩阵"控制，此处仅需勾选总开关'}>
                                    <Info size={14} style={{ color: '#1677ff', cursor: 'pointer', verticalAlign: 'middle' }} />
                                </Tooltip>
                            )}
                        </div>
                        {/* 动态按钮组可折叠 */}
                        {isDynamic && isCollapsed ? null : (
                            allChildrenAreLeaves ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', paddingLeft: 24, alignItems: 'center' }}>
                                    {node.children!.map((child) => (
                                        <Checkbox
                                            key={child.label}
                                            checked={checkedKeys.includes(child.label)}
                                            onChange={() => handleLeafToggle(child.label)}
                                            disabled={isDynamic}
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
                                        collapsedGroups={collapsedGroups}
                                        onToggleCollapse={onToggleCollapse}
                                    />
                                </div>
                            )
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
    const [menuCollapsedGroups, setMenuCollapsedGroups] = useState<Set<string>>(new Set());

    const toggleMenuCollapse = (label: string) => {
        setMenuCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(label)) next.delete(label);
            else next.add(label);
            return next;
        });
    };
    const [memberPage, setMemberPage] = useState(1);
    const memberPageSize = 10;
    const [userPickerOpen, setUserPickerOpen] = useState(false);
    const [userPickerSelected, setUserPickerSelected] = useState<string[]>([]);
    const [userPickerSearch, setUserPickerSearch] = useState('');
    const [userPickerExpanded, setUserPickerExpanded] = useState<string[]>(allExpandableKeys);
    const [disableModalOpen, setDisableModalOpen] = useState(false);
    const [disableReason, setDisableReason] = useState('');
    const [copying, setCopying] = useState(false);

    const filtered = roles.filter((r) => {
        const text = `${r.name}${r.code}${r.description}`.toLowerCase();
        return text.includes(search.toLowerCase()) && (typeFilter === 'all' || r.type === typeFilter);
    });

    // 按 parentId 组装上下级树形结构，用于以树形展示角色继承（上级角色）关系
    const roleTreeData = useMemo(() => {
        const nodes = filtered.map((r) => ({ ...r }));
        const byId = new Map(nodes.map((n) => [n.id, n] as const));
        const roots: Role[] = [];
        nodes.forEach((n) => {
            if (n.parentId && byId.has(n.parentId)) {
                const parent = byId.get(n.parentId)!;
                (parent.children || (parent.children = [])).push(n);
            } else {
                roots.push(n);
            }
        });
        return roots;
    }, [filtered]);

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
            title: '角色别名',
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
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={roleTreeData}
                    expandable={{ defaultExpandAllRows: true }}
                    pagination={false}
                />
                {roleTreeData.length === 0 && <div className="admin-empty">未找到匹配的角色</div>}
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
                            <Form.Item label="角色别名" required>
                                <Input value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="所属租户">
                                <Select value="dcc" disabled options={[{ value: 'dcc', label: 'DCC项目部' }]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="上级角色">
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
                                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>上级角色</div>
                                <div style={{ fontSize: 14 }}>{selected.parentName}</div>
                            </Col>
                        )}
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>使用人数</div>
                            <div style={{ fontSize: 14 }}>{selected.userCount} 人</div>
                        </Col>
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
                        <Tabs className="perm-tabs" data-annotation-id="annotation-12" activeKey={permTab} onChange={(k) => setPermTab(k)} items={[
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
                                                collapsedGroups={menuCollapsedGroups}
                                                onToggleCollapse={toggleMenuCollapse}
                                            />
                                        </div>
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
