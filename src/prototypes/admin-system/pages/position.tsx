import React, { useState } from 'react';
import {
    Briefcase,
    Plus,
    Pencil,
    Trash2,
    Search,
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
    Checkbox,
    message,
    Drawer,
    Pagination,
    Avatar,
    Tree,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';

 type Position = {
    id: string;
    name: string;
    orgName: string;
    orgPath: string;
    headcount: number;
    occupied: number;
    supervisorId?: string;
    supervisorName?: string;
    defaultRoles: string[];
    dataScope: string;
    status: 'active' | 'inactive';
    description?: string;
};

 const roleOptions = [
    '窑系统监控',
    '中控数据录入',
    '车间安全管理',
    '生产报表审核',
    '设备检修审批',
    '磨机监控',
    '销售合同审批',
    '客户管理',
    '化验单审核',
    '配方管理',
    '采购审批',
    '财务审核',
];

 const initialPositions: Position[] = [
    {
        id: 'p1',
        name: 'DCC水泥厂中控室操作员',
        orgName: '中控室',
        orgPath: '苏州中材 / 伊拉克区域 / DCC水泥厂 / 中控室',
        headcount: 12,
        occupied: 11,
        supervisorId: 'p2',
        supervisorName: '烧成班长',
        defaultRoles: ['窑系统监控', '中控数据录入'],
        dataScope: 'DCC水泥厂',
        status: 'active',
        description: '负责回转窑及磨机系统的DCS操作与参数调整',
    },
    {
        id: 'p2',
        name: '烧成班长',
        orgName: '烧成车间',
        orgPath: '苏州中材 / 伊拉克区域 / DCC水泥厂 / 烧成车间',
        headcount: 3,
        occupied: 3,
        supervisorId: 'p3',
        supervisorName: '烧成车间主任',
        defaultRoles: ['车间安全管理', '生产报表审核'],
        dataScope: '烧成车间',
        status: 'active',
        description: '负责烧成车间三班运行管理与安全监督',
    },
    {
        id: 'p3',
        name: '烧成车间主任',
        orgName: '烧成车间',
        orgPath: '苏州中材 / 伊拉克区域 / DCC水泥厂 / 烧成车间',
        headcount: 1,
        occupied: 1,
        defaultRoles: ['生产报表审核', '车间安全管理', '设备检修审批'],
        dataScope: 'DCC水泥厂',
        status: 'active',
    },
    {
        id: 'p4',
        name: '窑操作员',
        orgName: '烧成车间',
        orgPath: '苏州中材 / 伊拉克区域 / DCC水泥厂 / 烧成车间',
        headcount: 9,
        occupied: 9,
        supervisorId: 'p2',
        supervisorName: '烧成班长',
        defaultRoles: ['窑系统监控'],
        dataScope: '烧成车间',
        status: 'active',
    },
    {
        id: 'p5',
        name: '磨机操作员',
        orgName: '制成车间',
        orgPath: '苏州中材 / 伊拉克区域 / DCC水泥厂 / 制成车间',
        headcount: 6,
        occupied: 6,
        supervisorId: 'p6',
        supervisorName: '制成班长',
        defaultRoles: ['磨机监控'],
        dataScope: '制成车间',
        status: 'active',
    },
    {
        id: 'p6',
        name: '制成班长',
        orgName: '制成车间',
        orgPath: '苏州中材 / 伊拉克区域 / DCC水泥厂 / 制成车间',
        headcount: 2,
        occupied: 2,
        supervisorId: 'p7',
        supervisorName: '制成车间主任',
        defaultRoles: ['车间安全管理'],
        dataScope: '制成车间',
        status: 'active',
    },
    {
        id: 'p7',
        name: '制成车间主任',
        orgName: '制成车间',
        orgPath: '苏州中材 / 伊拉克区域 / DCC水泥厂 / 制成车间',
        headcount: 1,
        occupied: 1,
        defaultRoles: ['生产报表审核', '车间安全管理'],
        dataScope: 'DCC水泥厂',
        status: 'active',
    },
    {
        id: 'p8',
        name: '华东区域销售经理',
        orgName: '销售部',
        orgPath: '苏州中材 / 伊拉克区域 / 销售部',
        headcount: 1,
        occupied: 1,
        defaultRoles: ['销售合同审批', '客户管理'],
        dataScope: '伊拉克区域',
        status: 'active',
    },
    {
        id: 'p9',
        name: '化验室主任',
        orgName: '质量部',
        orgPath: '苏州中材 / 伊拉克区域 / DCC水泥厂 / 质量部',
        headcount: 1,
        occupied: 0,
        defaultRoles: ['化验单审核', '配方管理'],
        dataScope: 'DCC水泥厂',
        status: 'inactive',
    },
];

type PositionUser = {
    name: string;
    org: string;
};

const allAvailableUsers: PositionUser[] = [
    { name: '王志强', org: 'DCC水泥厂' },
    { name: '孙立军', org: '烧成车间' },
    { name: '周海涛', org: '烧成车间' },
    { name: '陈铁军', org: '制成车间' },
    { name: 'Ali Hassan', org: 'DCC水泥厂' },
    { name: '赵大勇', org: '石灰石矿山' },
    { name: '李明远', org: '伊拉克区域公司' },
    { name: '张伟', org: '中控室' },
    { name: '刘强', org: '中控室' },
    { name: '杨磊', org: '中控室' },
    { name: '黄涛', org: '中控室' },
    { name: '周军', org: '中控室' },
    { name: '吴勇', org: '中控室' },
    { name: '郑明', org: '中控室' },
    { name: '孙峰', org: '中控室' },
    { name: '钱辉', org: '中控室' },
    { name: '赵亮', org: '中控室' },
    { name: '王鹏', org: '中控室' },
    { name: '李浩', org: '烧成车间' },
    { name: '陈斌', org: '烧成车间' },
    { name: '杨杰', org: '制成车间' },
    { name: '黄飞', org: '制成车间' },
    { name: '周磊', org: '制成车间' },
    { name: '吴强', org: '制成车间' },
    { name: '郑伟', org: '制成车间' },
    { name: '孙军', org: '销售部' },
    { name: '钱涛', org: '质量部' },
];

const userOrgMap: Record<string, string> = Object.fromEntries(allAvailableUsers.map((u) => [u.name, u.org]));

function buildPosPickerTree(availableNames: string[]): DataNode[] {
    const availableSet = new Set(availableNames);
    const userNodes = (orgName: string): DataNode[] =>
        (posPickerOrgUsers[orgName] || []).filter((n) => availableSet.has(n)).map((name) => ({ title: name, key: name, isLeaf: true }));
    const hasVisibleChildren = (nodes: DataNode[]): boolean =>
        nodes.some((n) => (n.isLeaf) || (n.children && hasVisibleChildren(n.children as DataNode[])));
    const allNodes: DataNode[] = [
        {
            title: '苏州中材建设有限公司', key: 'org-root', selectable: false,
            children: [
                {
                    title: '伊拉克区域公司', key: 'org-iraq', selectable: false,
                    children: [
                        ...userNodes('伊拉克区域公司'),
                        {
                            title: 'DCC水泥厂', key: 'org-dcc', selectable: false,
                            children: [
                                ...userNodes('DCC水泥厂'),
                                { title: '石灰石矿山', key: 'org-矿山', children: userNodes('石灰石矿山') },
                                { title: '烧成车间', key: 'org-烧成', children: [...userNodes('烧成车间'), ...userNodes('窑系统一班'), ...userNodes('窑系统二班'), ...userNodes('窑系统三班')] },
                                { title: '制成车间', key: 'org-制成', children: [...userNodes('制成车间'), ...userNodes('磨机一班'), ...userNodes('磨机二班')] },
                                { title: '中控室', key: 'org-中控', children: userNodes('中控室') },
                            ].filter((n) => n.isLeaf || (n.children && hasVisibleChildren(n.children as DataNode[]))),
                        },
                        { title: 'Duhok粉磨站', key: 'org-duhok', children: userNodes('Duhok粉磨站') },
                    ].filter((n) => n.isLeaf || (n.children && hasVisibleChildren(n.children as DataNode[]))),
                },
            ],
        },
    ];
    return allNodes;
}

function getPosAllUserKeys(nodes: DataNode[]): string[] {
    const keys: string[] = [];
    for (const n of nodes) {
        if (n.isLeaf) keys.push(n.key as string);
        if (n.children) keys.push(...getPosAllUserKeys(n.children));
    }
    return keys;
}

function getPosParentKeys(nodes: DataNode[], selectedUsers: string[]): string[] {
    const parentKeys: string[] = [];
    for (const node of nodes) {
        if (!node.children || node.children.length === 0) continue;
        const childUserKeys = getPosAllUserKeys(node.children);
        if (childUserKeys.length > 0 && childUserKeys.every((k) => selectedUsers.includes(k))) {
            parentKeys.push(node.key as string);
        }
        parentKeys.push(...getPosParentKeys(node.children, selectedUsers));
    }
    return parentKeys;
}

function filterPosTree(nodes: DataNode[], keyword: string): DataNode[] {
    if (!keyword) return nodes;
    const lower = keyword.toLowerCase();
    const filtered: DataNode[] = [];
    for (const node of nodes) {
        const titleMatches = String(node.title).toLowerCase().includes(lower);
        const filteredChildren = node.children ? filterPosTree(node.children, keyword) : [];
        if (titleMatches || filteredChildren.length > 0) {
            filtered.push({ ...node, children: titleMatches ? node.children : filteredChildren });
        }
    }
    return filtered;
}

function getAllPosExpandableKeys(nodes: DataNode[]): string[] {
    const keys: string[] = [];
    for (const n of nodes) {
        if (n.children && n.children.length > 0) {
            keys.push(n.key as string);
            keys.push(...getAllPosExpandableKeys(n.children));
        }
    }
    return keys;
}

function collectPosExpandedKeys(nodes: DataNode[], keyword: string): string[] {
    if (!keyword) return [];
    const keys: string[] = [];
    const lower = keyword.toLowerCase();
    for (const node of nodes) {
        if (node.children && node.children.length > 0) {
            const childMatches = node.children.some((c) =>
                c.isLeaf ? String(c.title).toLowerCase().includes(lower) : true
            ) || collectPosExpandedKeys(node.children, keyword).length > 0;
            if (childMatches) keys.push(node.key as string);
            keys.push(...collectPosExpandedKeys(node.children, keyword));
        }
    }
    return keys;
}

const posPickerOrgUsers: Record<string, string[]> = {};
allAvailableUsers.forEach((u) => {
    if (!posPickerOrgUsers[u.org]) posPickerOrgUsers[u.org] = [];
    posPickerOrgUsers[u.org].push(u.name);
});

const initialPositionUsers: Record<string, string[]> = {
    p1: ['张伟', '刘强', '杨磊', '黄涛', '周军', '吴勇', '郑明', '孙峰', '钱辉', '赵亮', '王鹏'],
    p2: ['孙立军', '李浩', '陈斌'],
    p3: ['王志强'],
    p4: ['周海涛', '刘强', '杨磊', '黄涛', '周军', '吴勇', '郑明', '孙峰', '钱辉'],
    p5: ['杨杰', '黄飞', '周磊', '吴强', '郑伟', '赵亮'],
    p6: ['陈铁军', '王鹏'],
    p7: ['李明远'],
    p8: ['孙军'],
    p9: [],
};

 export default function PositionPage() {
    const [positions, setPositions] = useState<Position[]>(initialPositions);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [form, setForm] = useState<Partial<Position>>({});
    const [positionUsers, setPositionUsers] = useState<Record<string, string[]>>(initialPositionUsers);
    const [userDrawerOpen, setUserDrawerOpen] = useState(false);
    const [userDrawerPosId, setUserDrawerPosId] = useState<string | null>(null);
    const [posUserPickerOpen, setPosUserPickerOpen] = useState(false);
    const [posUserPickerSelected, setPosUserPickerSelected] = useState<string[]>([]);
    const [posUserPickerSearch, setPosUserPickerSearch] = useState('');
    const [posUserPickerExpanded, setPosUserPickerExpanded] = useState<string[]>([]);
    const [memberPage, setMemberPage] = useState(1);
    const memberPageSize = 10;

    const filtered = positions.filter((p) => {
        const matchSearch = `${p.name}${p.orgName}${p.orgPath}`.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const openAdd = () => {
        setModalMode('add');
        setForm({ status: 'active', headcount: 1, occupied: 0, defaultRoles: [] });
        setModalOpen(true);
    };

    const openEdit = (id: string) => {
        const p = positions.find((x) => x.id === id);
        if (!p) return;
        setModalMode('edit');
        setForm({ ...p });
        setModalOpen(true);
    };

    const handleSave = () => {
        if (modalMode === 'add') {
            const newPos: Position = {
                ...(form as Position),
                id: `p${Date.now()}`,
            };
            setPositions([...positions, newPos]);
            message.success('新增岗位成功');
        } else if (form.id) {
            setPositions(positions.map((p) => (p.id === form.id ? { ...p, ...form } as Position : p)));
            message.success('编辑岗位成功');
        }
        setModalOpen(false);
    };

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: '确定删除该岗位？',
            onOk: () => {
                setPositions(positions.filter((p) => p.id !== id));
                message.success('删除成功');
            },
        });
    };

    const toggleStatus = (id: string) => {
        const target = positions.find((p) => p.id === id);
        if (!target) return;
        const action = target.status === 'active' ? '停用' : '启用';
        Modal.confirm({
            title: `确定${action}该岗位？`,
            onOk: () => {
                setPositions(positions.map((p) => (p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } as Position : p)));
                message.success(`${action}成功`);
            },
        });
    };

    const columns: ColumnsType<Position> = [
        {
            title: '岗位名称',
            dataIndex: 'name',
            render: (v, p) => (
                <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
                    {p.description && <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{p.description}</div>}
                </div>
            ),
        },
        {
            title: '直接上级',
            dataIndex: 'supervisorName',
            render: (v) => v || '-',
        },
        {
            title: '默认角色',
            dataIndex: 'defaultRoles',
            render: (roles: string[]) => (
                <Space size={4} wrap>
                    {roles.map((r) => (
                        <Tag key={r} style={{ fontSize: 11 }}>{r}</Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            render: (v) => (
                <Tag color={v === 'active' ? 'success' : 'error'}>
                    {v === 'active' ? '已启用' : '已停用'}
                </Tag>
            ),
        },
        {
            title: '使用人数',
            key: 'usage',
            render: (_, p) => {
                const count = (positionUsers[p.id] || []).length;
                return (
                    <Button type="link" size="small" onClick={(e) => {
                        e.stopPropagation();
                        setUserDrawerPosId(p.id);
                        setMemberPage(1);
                        setUserDrawerOpen(true);
                    }}>
                        {count}
                    </Button>
                );
            },
        },
        {
            title: '操作',
            key: 'action',
            width: 180,
            render: (_, p) => (
                <Space size="small">
                    <Button type="link" size="small" onClick={() => openEdit(p.id)}>编辑</Button>
                    <Button type="link" size="small" onClick={() => toggleStatus(p.id)}>
                        {p.status === 'active' ? '停用' : '启用'}
                    </Button>
                    <Button type="link" size="small" danger onClick={() => handleDelete(p.id)}>删除</Button>
                </Space>
            ),
        },
    ];

    const members = userDrawerPosId ? (positionUsers[userDrawerPosId] || []) : [];
    const pagedMembers = members.slice((memberPage - 1) * memberPageSize, memberPage * memberPageSize);

    const drawPos = positions.find((p) => p.id === userDrawerPosId) || null;
    const assignedUserNames = userDrawerPosId ? (positionUsers[userDrawerPosId] || []) : [];
    const availableForPick = allAvailableUsers
        .map((u) => u.name)
        .filter((name) => !assignedUserNames.includes(name));

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Button type="primary" icon={<Plus size={14} />} onClick={openAdd}>新增岗位</Button>
                <div style={{ flex: 1 }} />
                <Select
                    value={statusFilter}
                    style={{ width: 120 }}
                    onChange={(v) => setStatusFilter(v)}
                    options={[
                        { value: 'all', label: '全部状态' },
                        { value: 'active', label: '已启用' },
                        { value: 'inactive', label: '已停用' },
                    ]}
                />
                <Input.Search
                    placeholder="搜索岗位..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 200 }}
                    allowClear
                />
            </div>

            <div className="admin-card" style={{ padding: 0 }}>
                <Table rowKey="id" columns={columns} dataSource={filtered} pagination={false} />
                {filtered.length === 0 && <div className="admin-empty">未找到匹配的岗位</div>}
            </div>

            <Modal
                open={modalOpen}
                title={modalMode === 'add' ? '新增岗位' : '编辑岗位'}
                onCancel={() => setModalOpen(false)}
                onOk={handleSave}
                width={480}
            >
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="岗位名称" required>
                                <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="直接上级岗位">
                                <Select
                                    value={form.supervisorId || ''}
                                    onChange={(id) => {
                                        const sup = positions.find((x) => x.id === id);
                                        setForm({ ...form, supervisorId: id || undefined, supervisorName: sup?.name });
                                    }}
                                    placeholder="无"
                                    allowClear
                                    options={[{ value: '', label: '无' }, ...positions.map((p) => ({ value: p.id, label: p.name }))]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="默认角色">
                        <Select
                            mode="multiple"
                            placeholder="请选择默认角色"
                            value={form.defaultRoles || []}
                            onChange={(vals) => setForm({ ...form, defaultRoles: vals as string[] })}
                            options={roleOptions.map((r) => ({ label: r, value: r }))}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                    <Form.Item label="岗位描述">
                        <Input.TextArea
                            value={form.description || ''}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={2}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Drawer
                open={userDrawerOpen}
                title={drawPos ? `${drawPos.name} - 使用人员` : '使用人员'}
                width={600}
                onClose={() => setUserDrawerOpen(false)}
                footer={
                    <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                        <Button onClick={() => setUserDrawerOpen(false)}>关闭</Button>
                    </Space>
                }
            >
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Button type="primary" icon={<UserPlus size={14} />} onClick={() => {
                        setPosUserPickerSelected([]);
                        setPosUserPickerSearch('');
                        setPosUserPickerExpanded(getAllPosExpandableKeys(buildPosPickerTree(availableForPick)));
                        setPosUserPickerOpen(true);
                    }}>添加人员</Button>
                    <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>
                        已使用 {assignedUserNames.length} 人
                    </span>
                </div>
                <Table
                    rowKey={(r, i) => String(i)}
                    columns={[
                        {
                            title: '姓名',
                            dataIndex: 'name',
                            render: (v: string) => (
                                <Space>
                                    <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>{v[0]}</Avatar>
                                    <span>{v}</span>
                                </Space>
                            ),
                        },
                        {
                            title: '所在组织',
                            dataIndex: 'org',
                            render: (v: string) => v || '-',
                        },
                        {
                            title: '操作',
                            key: 'action',
                            render: (_, __, idx) => {
                                const realIdx = (memberPage - 1) * memberPageSize + idx;
                                return (
                                    <Button type="link" size="small" danger onClick={() => {
                                        if (!userDrawerPosId) return;
                                        setPositionUsers((prev) => ({
                                            ...prev,
                                            [userDrawerPosId]: prev[userDrawerPosId].filter((_, i) => i !== realIdx),
                                        }));
                                    }}>移除</Button>
                                );
                            },
                        },
                    ]}
                    dataSource={pagedMembers.map((name) => ({ name, org: userOrgMap[name] || '-' }))}
                    pagination={false}
                />
                {members.length === 0 && <div className="admin-empty">暂无使用人员</div>}
                {members.length > memberPageSize && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                        <Pagination
                            current={memberPage}
                            pageSize={memberPageSize}
                            total={members.length}
                            onChange={(p) => setMemberPage(p)}
                            showSizeChanger={false}
                        />
                    </div>
                )}
            </Drawer>

            <Modal
                open={posUserPickerOpen}
                title="选择人员"
                onCancel={() => setPosUserPickerOpen(false)}
                onOk={() => {
                    if (!userDrawerPosId) return;
                    const current = positionUsers[userDrawerPosId] || [];
                    const newUsers = posUserPickerSelected.filter((u) => !current.includes(u));
                    setPositionUsers((prev) => ({
                        ...prev,
                        [userDrawerPosId]: [...current, ...newUsers],
                    }));
                    setPosUserPickerOpen(false);
                }}
                width={600}
            >
                <div style={{ display: 'flex', gap: 16, minHeight: 360 }}>
                    <div style={{ flex: 1, overflow: 'auto', maxHeight: 400 }}>
                        <div style={{ fontSize: 13, color: '#1677ff', marginBottom: 8 }}>可选人员</div>
                        <Input.Search
                            placeholder="搜索人员或组织..."
                            value={posUserPickerSearch}
                            onChange={(e) => {
                                setPosUserPickerSearch(e.target.value);
                                const tree = buildPosPickerTree(availableForPick);
                                if (e.target.value) {
                                    setPosUserPickerExpanded(collectPosExpandedKeys(tree, e.target.value));
                                } else {
                                    setPosUserPickerExpanded(getAllPosExpandableKeys(tree));
                                }
                            }}
                            onSearch={() => {}}
                            allowClear
                            style={{ marginBottom: 8 }}
                        />
                        <Tree
                            checkable
                            expandedKeys={posUserPickerExpanded}
                            onExpand={(keys) => setPosUserPickerExpanded(keys as string[])}
                            treeData={filterPosTree(buildPosPickerTree(availableForPick), posUserPickerSearch)}
                            checkedKeys={[
                                ...posUserPickerSelected,
                                ...getPosParentKeys(buildPosPickerTree(availableForPick), posUserPickerSelected),
                            ]}
                            onCheck={(checked) => {
                                const keys = checked as string[];
                                const allKeys = getPosAllUserKeys(buildPosPickerTree(availableForPick));
                                setPosUserPickerSelected(keys.filter((k) => allKeys.includes(k)));
                            }}
                        />
                    </div>
                    <div style={{ width: 200 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>已选择（{posUserPickerSelected.length}）</div>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {posUserPickerSelected.map((u) => (
                                <Tag key={u} closable onClose={() => setPosUserPickerSelected((prev) => prev.filter((x) => x !== u))}>
                                    {u}
                                </Tag>
                            ))}
                            {posUserPickerSelected.length === 0 && <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.25)' }}>暂未选择</div>}
                        </Space>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
