import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import {
    Plus,
    Trash2,
    Phone,
    Mail,
    Lock,
    Unlock,
} from 'lucide-react';
import {
    Table,
    Button,
    Input,
    Select,
    TreeSelect,
    Modal,
    Form,
    Tree,
    Pagination,
    Tag,
    Space,
    Row,
    Col,
    DatePicker,
    Checkbox,
    Radio,
    message,
    Avatar,
} from 'antd';
import { baseOrgData } from './org-data';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';

 type PartTimeItem = {
    position: string;
    org: string;
};

 type UserItem = {
    id: string;
    name: string;
    employeeNo: string;
    phone: string;
    email: string;
    entryDate: string;
    status: 'active' | 'leave' | 'frozen';
    userType: 'internal' | 'contractor' | 'temp';
    mainPosition: string;
    mainOrg: string;
    partTimePositions: string[];
    partTimeItems?: PartTimeItem[];
    roles: string[];
    accountExpiry?: string;
    loginRestrict?: string;
};

 const initialUsers: UserItem[] = [
    {
        id: 'u1',
        name: '王志强',
        employeeNo: 'SZCC-2018-0042',
        phone: '+964-750-234-5678',
        email: 'wang.zhiqiang@szcc.com',
        entryDate: '2018-05-12',
        status: 'active',
        userType: 'internal',
        mainPosition: 'DCC水泥厂厂长',
        mainOrg: 'DCC水泥厂',
        partTimePositions: [],
        roles: ['工厂管理员', '生产审批'],
    },
    {
        id: 'u2',
        name: '孙立军',
        employeeNo: 'SZCC-2019-0087',
        phone: '+964-750-345-6789',
        email: 'sun.lijun@szcc.com',
        entryDate: '2019-03-20',
        status: 'active',
        userType: 'internal',
        mainPosition: '烧成班长',
        mainOrg: '烧成车间',
        partTimePositions: ['窑系统应急负责人'],
        roles: ['车间安全员'],
    },
    {
        id: 'u3',
        name: '周海涛',
        employeeNo: 'SZCC-2020-0156',
        phone: '+964-750-456-7890',
        email: 'zhou.haitao@szcc.com',
        entryDate: '2020-07-08',
        status: 'active',
        userType: 'internal',
        mainPosition: '窑系统一班班长',
        mainOrg: '烧成车间',
        partTimePositions: [],
        roles: ['窑系统监控'],
    },
    {
        id: 'u4',
        name: '陈铁军',
        employeeNo: 'SZCC-2019-0091',
        phone: '+964-750-567-8901',
        email: 'chen.tiejun@szcc.com',
        entryDate: '2019-04-15',
        status: 'active',
        userType: 'internal',
        mainPosition: '制成车间主任',
        mainOrg: '制成车间',
        partTimePositions: [],
        roles: ['生产报表审核', '车间安全管理'],
    },
    {
        id: 'u5',
        name: 'Ali Hassan',
        employeeNo: 'SZCC-EXT-2022-003',
        phone: '+964-750-678-9012',
        email: 'ali.hassan@contractor.iq',
        entryDate: '2022-01-10',
        status: 'active',
        userType: 'contractor',
        mainPosition: '外部运输协调员',
        mainOrg: 'DCC水泥厂',
        partTimePositions: [],
        roles: ['运输调度查看'],
        accountExpiry: '2025-12-31',
        loginRestrict: '仅厂区内网',
    },
    {
        id: 'u6',
        name: '赵大勇',
        employeeNo: 'SZCC-2018-0055',
        phone: '+964-750-789-0123',
        email: 'zhao.dayong@szcc.com',
        entryDate: '2018-06-01',
        status: 'leave',
        userType: 'internal',
        mainPosition: '矿山负责人',
        mainOrg: '石灰石矿山',
        partTimePositions: [],
        roles: ['矿山管理'],
    },
    {
        id: 'u7',
        name: '李明远',
        employeeNo: 'SZCC-2017-0012',
        phone: '+964-750-123-4567',
        email: 'li.mingyuan@szcc.com',
        entryDate: '2017-09-01',
        status: 'active',
        userType: 'internal',
        mainPosition: '伊拉克区域总经理',
        mainOrg: '伊拉克区域公司',
        partTimePositions: [],
        roles: ['区域管理员', '集团报表'],
    },
];

 const roleOptions = [
    '工厂管理员',
    '生产审批',
    '车间安全员',
    '窑系统监控',
    '生产报表审核',
    '车间安全管理',
    '运输调度查看',
    '矿山管理',
    '区域管理员',
    '集团报表',
    '中控数据录入',
    '设备检修审批',
    '磨机监控',
    '销售合同审批',
    '客户管理',
    '化验单审核',
    '配方管理',
    '采购审批',
    '财务审核',
];

 const positionOptions = [
    'DCC水泥厂厂长',
    '烧成班长',
    '窑系统一班班长',
    '制成车间主任',
    '外部运输协调员',
    '矿山负责人',
    '伊拉克区域总经理',
    '窑操作员',
    '磨机操作员',
    '制成班长',
    '中控室操作员',
];

 const positionToRoles: Record<string, string[]> = {
    'DCC水泥厂厂长': ['工厂管理员', '生产审批'],
    '烧成班长': ['车间安全员'],
    '窑系统一班班长': ['窑系统监控'],
    '制成车间主任': ['生产报表审核', '车间安全管理'],
    '外部运输协调员': ['运输调度查看'],
    '矿山负责人': ['矿山管理'],
    '伊拉克区域总经理': ['区域管理员', '集团报表'],
    '窑操作员': ['中控数据录入'],
    '磨机操作员': ['磨机监控'],
    '制成班长': ['生产报表审核'],
    '中控室操作员': ['中控数据录入'],
};

 const orgTreeData: DataNode[] = [
    {
        key: '1',
        title: '苏州中材建设有限公司',
        children: [
            {
                key: '2',
                title: '伊拉克区域公司',
                children: [
                    {
                        key: '3',
                        title: 'DCC水泥厂',
                        children: [
                            { key: '4', title: '石灰石矿山' },
                            {
                                key: '5',
                                title: '烧成车间',
                                children: [
                                    { key: '6', title: '窑系统一班' },
                                    { key: '7', title: '窑系统二班' },
                                    { key: '8', title: '窑系统三班' },
                                ],
                            },
                            {
                                key: '9',
                                title: '制成车间',
                                children: [
                                    { key: '10', title: '磨机一班' },
                                    { key: '11', title: '磨机二班' },
                                ],
                            },
                            { key: '12', title: '中控室' },
                        ],
                    },
                    { key: '13', title: 'Duhok粉磨站' },
                ],
            },
        ],
    },
];

 const userTypeLabel: Record<string, string> = { internal: '内部员工', contractor: '外部承包商', temp: '临时人员' };
 const statusMeta: Record<string, { label: string; color: string }> = {
    active: { label: '在职', color: 'success' },
    leave: { label: '离职', color: 'error' },
    frozen: { label: '冻结', color: 'warning' },
};

const orgNameMap: Record<string, string> = {};
function buildOrgNameMap(nodes: DataNode[]) {
    for (const n of nodes) {
        orgNameMap[String(n.key)] = String(n.title);
        if (n.children) buildOrgNameMap(n.children);
    }
}
buildOrgNameMap(orgTreeData);

/** 将组织架构数据转为 TreeSelect 可用的 treeData，所有层级均可选，value 为组织名称 */
function toOrgTreeSelectData(nodes: typeof baseOrgData): any[] {
    return nodes.map((node) => ({
        title: node.name,
        value: node.name,
        children: node.children ? toOrgTreeSelectData(node.children) : undefined,
    }));
}
const orgTreeSelectData = toOrgTreeSelectData(baseOrgData);

/** 根据组织名称查找其从根节点开始的完整路径 */
function findOrgPathByName(nodes: typeof baseOrgData, name: string, parents: string[] = []): string | null {
    for (const node of nodes) {
        const path = [...parents, node.name];
        if (node.name === name) return path.join(' / ');
        if (node.children) {
            const found = findOrgPathByName(node.children, name, path);
            if (found) return found;
        }
    }
    return null;
}

 export default function UserPage() {
    const [users, setUsers] = useState<UserItem[]>(initialUsers);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'leave' | 'frozen'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'internal' | 'contractor' | 'temp'>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [form, setForm] = useState<Partial<UserItem>>({});
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailId, setDetailId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [treeSelectedId, setTreeSelectedId] = useState<string | null>(null);
    const [treeExpanded, setTreeExpanded] = useState<string[]>(['1', '2', '3']);

    // 交接人相关状态
    const [handoverModalOpen, setHandoverModalOpen] = useState(false);
    const [handoverSelectorOpen, setHandoverSelectorOpen] = useState(false);
    const [handoverSelectedUser, setHandoverSelectedUser] = useState<string | null>(null);
    const [handoverAction, setHandoverAction] = useState<(() => void) | null>(null);
    const [handoverSearch, setHandoverSearch] = useState('');
    const [handoverExpandedKeys, setHandoverExpandedKeys] = useState<string[]>(['1', '2', '3']);

    const treeSelectedName = useMemo(() => {
        if (!treeSelectedId) return null;
        return orgNameMap[treeSelectedId] || null;
    }, [treeSelectedId]);

    /** 对用户进行离职/冻结/删除等操作时，先询问是否指定交接人 */
    const showHandoverConfirm = (actionLabel: string, onConfirm: () => void) => {
        setHandoverAction(() => onConfirm);
        setHandoverModalOpen(true);
    };

    const handleHandoverYes = () => {
        setHandoverModalOpen(false);
        setHandoverSelectorOpen(true);
    };

    const handleHandoverNo = () => {
        setHandoverModalOpen(false);
        handoverAction?.();
    };

    const handleHandoverSelectConfirm = () => {
        const target = users.find((u) => u.id === handoverSelectedUser);
        handoverAction?.();
        setHandoverSelectorOpen(false);
        setHandoverSelectedUser(null);
        setHandoverAction(null);
        if (target) {
            message.success(`已将该用户的任务、待办、消息移交至 ${target.name}`);
        }
    };

    const filtered = users.filter((u) => {
        const text = `${u.name}${u.employeeNo}${u.phone}${u.mainPosition}`.toLowerCase();
        const matchSearch = text.includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || u.status === statusFilter;
        const matchType = typeFilter === 'all' || u.userType === typeFilter;
        const matchOrg = !treeSelectedName || u.mainOrg === treeSelectedName || u.mainOrg.includes(treeSelectedName);
        return matchSearch && matchStatus && matchType && matchOrg;
    });

    const total = filtered.length;
    const pagedUsers = filtered.slice((page - 1) * pageSize, page * pageSize);

    const selected = users.find((u) => u.id === detailId) || null;

    const openAdd = () => {
        setModalMode('add');
        setForm({ status: 'active', userType: 'internal', partTimePositions: [], roles: [] });
        setModalOpen(true);
    };

    const openEdit = (id: string) => {
        const u = users.find((x) => x.id === id);
        if (!u) return;
        const defaultRoles = positionToRoles[u.mainPosition] || [];
        const mergedRoles = Array.from(new Set([...defaultRoles, ...u.roles]));
        setModalMode('edit');
        setForm({ ...u, roles: mergedRoles });
        setModalOpen(true);
    };

    const handleSave = () => {
        if (modalMode === 'add') {
            const newUser: UserItem = { ...(form as UserItem), id: `u${Date.now()}` };
            setUsers([...users, newUser]);
            message.success('新增用户成功');
        } else if (form.id) {
            const original = users.find((u) => u.id === form.id);
            const newStatus = form.status;
            // 编辑时状态变更为离职/冻结，需要交接确认
            if (original && newStatus && original.status !== newStatus && (newStatus === 'leave' || newStatus === 'frozen')) {
                const label = newStatus === 'leave' ? '离职' : '冻结';
                showHandoverConfirm(label, () => {
                    setUsers(users.map((u) => (u.id === form.id ? { ...u, ...form } as UserItem : u)));
                    message.success(`${label}操作成功`);
                });
                setModalOpen(false);
                return;
            }
            setUsers(users.map((u) => (u.id === form.id ? { ...u, ...form } as UserItem : u)));
            message.success('编辑用户成功');
        }
        setModalOpen(false);
    };

    const handleFreeze = (id: string) => {
        const target = users.find((u) => u.id === id);
        if (target?.status === 'frozen') {
            // 解冻操作无需交接人确认
            setUsers(users.map((u) => (u.id === id ? { ...u, status: 'active' } as UserItem : u)));
            message.success('解冻成功');
        } else {
            showHandoverConfirm('冻结', () => {
                setUsers(users.map((u) => (u.id === id ? { ...u, status: 'frozen' } as UserItem : u)));
                message.success('冻结成功');
            });
        }
    };

    const batchFreeze = () => {
        showHandoverConfirm('批量冻结', () => {
            setUsers((prev) => prev.map((u) => (selectedIds.has(u.id) ? { ...u, status: 'frozen' } as UserItem : u)));
            setSelectedIds(new Set());
            message.success('批量冻结成功');
        });
    };

    const batchUnfreeze = () => {
        Modal.confirm({
            title: '确定解冻选中的用户？',
            onOk: () => {
                setUsers((prev) => prev.map((u) => (selectedIds.has(u.id) ? { ...u, status: 'active' } as UserItem : u)));
                setSelectedIds(new Set());
                message.success('批量解冻成功');
            },
        });
    };

    const batchDelete = () => {
        showHandoverConfirm('批量删除', () => {
            setUsers((prev) => prev.filter((u) => !selectedIds.has(u.id)));
            setSelectedIds(new Set());
            message.success('批量删除成功');
        });
    };

    const batchResetPassword = () => {
        Modal.confirm({
            title: '确定重置选中用户的密码？',
            onOk: () => {
                message.success('已重置选中用户的密码');
                setSelectedIds(new Set());
            },
        });
    };

    const rowSelection = {
        selectedRowKeys: Array.from(selectedIds),
        onChange: (keys: React.Key[]) => {
            setSelectedIds(new Set(keys as string[]));
        },
    };

    const columns: ColumnsType<UserItem> = [
        {
            title: '用户',
            dataIndex: 'name',
            render: (_, u) => (
                <Space>
                    <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>{u.name[0]}</Avatar>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{u.email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: '登录名',
            dataIndex: 'employeeNo',
        },
        {
            title: '主岗',
            render: (_, u) => {
                const orgPath = findOrgPathByName(baseOrgData, u.mainOrg);
                return (
                    <div>
                        <div>{u.mainPosition}</div>
                        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{orgPath || u.mainOrg}</div>
                    </div>
                );
            },
        },
        {
            title: '角色',
            dataIndex: 'roles',
            render: (roles: string[]) => (
                <Space size={4} wrap>
                    {roles.map((r) => (
                        <Tag key={r} style={{ fontSize: 11 }}>{r}</Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: '类型',
            dataIndex: 'userType',
            render: (v) => userTypeLabel[v],
        },
        {
            title: '状态',
            dataIndex: 'status',
            render: (v) => (
                <Tag color={statusMeta[v].color} style={{ fontSize: 11 }}>
                    {statusMeta[v].label}
                </Tag>
            ),
        },
        {
            title: '操作',
            key: 'action',
            width: 220,
            render: (_, u) => (
                <Space size="small">
                    <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); openEdit(u.id); }}>编辑</Button>
                    <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); handleFreeze(u.id); }}>
                        {u.status === 'frozen' ? '解冻' : '冻结'}
                    </Button>
                    <Button type="link" size="small" onClick={(e) => {
                        e.stopPropagation();
                        Modal.confirm({
                            title: '确定重置该用户密码？',
                            onOk: () => message.success('密码已重置'),
                        });
                    }}>重置密码</Button>
                    <Button type="link" size="small" danger onClick={(e) => {
                        e.stopPropagation();
                        showHandoverConfirm('删除', () => {
                            setUsers(users.filter((x) => x.id !== u.id));
                            message.success('删除成功');
                        });
                    }}>删除</Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div data-annotation-id="user-filter-bar" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Button type="primary" icon={<Plus size={14} />} onClick={openAdd}>新增用户</Button>
                {selectedIds.size > 0 && (
                    <Space>
                        <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>已选 {selectedIds.size} 项</span>
                        <Button size="small" icon={<Lock size={12} />} onClick={batchFreeze}>冻结</Button>
                        <Button size="small" icon={<Unlock size={12} />} onClick={batchUnfreeze}>解冻</Button>
                        <Button size="small" icon={<Lock size={12} />} onClick={batchResetPassword}>重置密码</Button>
                        <Button size="small" danger icon={<Trash2 size={12} />} onClick={batchDelete}>删除</Button>
                    </Space>
                )}
                <div style={{ flex: 1 }} />
                <Select
                    value={typeFilter}
                    style={{ width: 120 }}
                    onChange={(v) => setTypeFilter(v)}
                    options={[
                        { value: 'all', label: '全部类型' },
                        { value: 'internal', label: '内部员工' },
                        { value: 'contractor', label: '外部承包商' },
                        { value: 'temp', label: '临时人员' },
                    ]}
                />
                <Select
                    value={statusFilter}
                    style={{ width: 120 }}
                    onChange={(v) => setStatusFilter(v)}
                    options={[
                        { value: 'all', label: '全部状态' },
                        { value: 'active', label: '在职' },
                        { value: 'frozen', label: '冻结' },
                        { value: 'leave', label: '离职' },
                    ]}
                />
                <Input.Search
                    placeholder="搜索用户..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 200 }}
                    allowClear
                />
            </div>

            <div className="admin-split">
                <div className="admin-split-left" style={{ width: 240, minWidth: 240, padding: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, padding: '0 0 8px' }}>组织机构</div>
                    <Tree
                        treeData={orgTreeData}
                        selectedKeys={treeSelectedId ? [treeSelectedId] : []}
                        expandedKeys={treeExpanded}
                        onExpand={(keys) => setTreeExpanded(keys as string[])}
                        onSelect={(keys) => setTreeSelectedId(keys[0] as string || null)}
                    />
                    {treeSelectedId && (
                        <div style={{ padding: '8px 0' }}>
                            <Button size="small" onClick={() => setTreeSelectedId(null)}>清除筛选</Button>
                        </div>
                    )}
                </div>

                <div className="admin-split-right">
                    <div data-annotation-id="user-table" className="admin-card" style={{ padding: 0 }}>
                        <Table
                            rowKey="id"
                            rowSelection={rowSelection}
                            columns={columns}
                            dataSource={pagedUsers}
                            pagination={false}
                            onRow={(u) => ({
                                onClick: () => { setDetailId(u.id); setDetailOpen(true); },
                                style: { cursor: 'pointer' },
                            })}
                        />
                        {filtered.length === 0 && <div className="admin-empty">未找到匹配的用户</div>}
                        {filtered.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 12 }}>
                                <Pagination
                                    current={page}
                                    pageSize={pageSize}
                                    total={total}
                                    onChange={(p, ps) => { setPage(p); setPageSize(ps || 10); }}
                                    showSizeChanger
                                    pageSizeOptions={[10, 20, 50]}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                open={modalOpen}
                title={modalMode === 'add' ? '新增用户' : '编辑用户'}
                onCancel={() => setModalOpen(false)}
                onOk={handleSave}
                width={720}
                styles={{ body: { maxHeight: '60vh', overflowY: 'auto' } }}
            >
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="姓名" required>
                                <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="登录账号" required>
                                <Input value={form.employeeNo || ''} onChange={(e) => setForm({ ...form, employeeNo: e.target.value })} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="手机号">
                                <Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="邮箱">
                                <Input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="入职日期">
                                <DatePicker
                                    style={{ width: '100%' }}
                                    value={form.entryDate ? dayjs(form.entryDate) : null}
                                    onChange={(d) => setForm({ ...form, entryDate: d ? d.format('YYYY-MM-DD') : '' })}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="用户类型">
                                <Select
                                    value={form.userType || 'internal'}
                                    onChange={(v) => setForm({ ...form, userType: v })}
                                    options={[
                                        { value: 'internal', label: '内部员工' },
                                        { value: 'contractor', label: '外部承包商' },
                                        { value: 'temp', label: '临时人员' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="主岗" required>
                                <Select
                                    value={form.mainPosition || ''}
                                    onChange={(pos) => {
                                        const defaultRoles = positionToRoles[pos] || [];
                                        setForm({ ...form, mainPosition: pos, roles: defaultRoles });
                                    }}
                                    placeholder="请选择主岗"
                                    options={positionOptions.map((p) => ({ value: p, label: p }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="所属组织" required>
                                <TreeSelect
                                    value={form.mainOrg || undefined}
                                    onChange={(v) => setForm({ ...form, mainOrg: v })}
                                    placeholder="请选择所属组织"
                                    treeData={orgTreeSelectData}
                                    style={{ width: '100%' }}
                                    treeDefaultExpandAll
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="状态" required>
                                <Select
                                    value={form.status || 'active'}
                                    onChange={(v) => setForm({ ...form, status: v })}
                                    options={[
                                        { value: 'active', label: '在职' },
                                        { value: 'frozen', label: '冻结' },
                                        { value: 'leave', label: '离职' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="角色">
                        <Select
                            mode="multiple"
                            placeholder="请选择角色"
                            value={form.roles || []}
                            onChange={(vals) => {
                                setForm({ ...form, roles: vals as string[] });
                            }}
                            options={roleOptions.map((r) => ({
                                label: r,
                                value: r,
                                disabled: (positionToRoles[form.mainPosition || ''] || []).includes(r),
                            }))}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                    <Form.Item label="兼职岗位及组织">
                        <Button
                            type="dashed"
                            size="small"
                            icon={<Plus size={12} />}
                            onClick={() => {
                                const items = form.partTimeItems ? [...form.partTimeItems, { position: '', org: '' }] : [{ position: '', org: '' }];
                                setForm({ ...form, partTimeItems: items });
                            }}
                        >添加</Button>
                        {(form.partTimeItems || []).length === 0 && (
                            <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.25)', marginTop: 8 }}>暂无兼职</div>
                        )}
                        {(form.partTimeItems || []).map((item, idx) => (
                            <Row gutter={8} key={idx} style={{ marginTop: 8 }}>
                                <Col span={10}>
                                    <Select
                                        style={{ width: '100%' }}
                                        value={item.position}
                                        placeholder="请选择兼职岗位"
                                        onChange={(v) => {
                                            const next = [...(form.partTimeItems || [])];
                                            next[idx] = { ...next[idx], position: v };
                                            setForm({ ...form, partTimeItems: next });
                                        }}
                                        options={positionOptions.map((p) => ({ value: p, label: p }))}
                                    />
                                </Col>
                                <Col span={10}>
                                    <TreeSelect
                                        style={{ width: '100%' }}
                                        value={item.org || undefined}
                                        placeholder="请选择所属组织"
                                        treeData={orgTreeSelectData}
                                        treeDefaultExpandAll
                                        allowClear
                                        onChange={(v) => {
                                            const next = [...(form.partTimeItems || [])];
                                            next[idx] = { ...next[idx], org: v };
                                            setForm({ ...form, partTimeItems: next });
                                        }}
                                    />
                                </Col>
                                <Col span={4}>
                                    <Button size="small" danger icon={<Trash2 size={12} />} onClick={() => {
                                        const next = (form.partTimeItems || []).filter((_, i) => i !== idx);
                                        setForm({ ...form, partTimeItems: next });
                                    }} />
                                </Col>
                            </Row>
                        ))}
                    </Form.Item>
                    {form.userType === 'contractor' && (
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="账户有效期">
                                    <DatePicker
                                        style={{ width: '100%' }}
                                        value={form.accountExpiry ? dayjs(form.accountExpiry) : null}
                                        onChange={(d) => setForm({ ...form, accountExpiry: d ? d.format('YYYY-MM-DD') : '' })}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="登录限制">
                                    <Input value={form.loginRestrict || ''} onChange={(e) => setForm({ ...form, loginRestrict: e.target.value })} />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}
                </Form>
            </Modal>

            <Modal
                open={detailOpen}
                title="用户详情"
                onCancel={() => setDetailOpen(false)}
                footer={null}
                width={560}
            >
                {selected && (
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>姓名</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{selected.name}</div>
                        </Col>
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>状态</div>
                            <Tag color={statusMeta[selected.status].color}>{statusMeta[selected.status].label}</Tag>
                        </Col>
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>登录名</div>
                            <div style={{ fontSize: 14 }}>{selected.employeeNo}</div>
                        </Col>
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>类型</div>
                            <div style={{ fontSize: 14 }}>{userTypeLabel[selected.userType]}</div>
                        </Col>
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>联系方式</div>
                            <div style={{ fontSize: 13 }}><Phone size={12} /> {selected.phone}</div>
                            <div style={{ fontSize: 13 }}><Mail size={12} /> {selected.email}</div>
                        </Col>
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>入职日期</div>
                            <div style={{ fontSize: 14 }}>{selected.entryDate}</div>
                        </Col>
                        <Col span={24}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>主岗 / 组织</div>
                            <div style={{ fontSize: 14 }}>{selected.mainPosition} · {selected.mainOrg}</div>
                        </Col>
                        {(selected.partTimeItems || []).length > 0 && (
                            <Col span={24}>
                                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>兼职岗位及组织</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {(selected.partTimeItems || []).map((pt, idx) => (
                                        <div key={idx} style={{ fontSize: 14 }}>
                                            {pt.position} · {pt.org}
                                        </div>
                                    ))}
                                </div>
                            </Col>
                        )}
                        <Col span={24}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>角色</div>
                            <Space size={8}>
                                {selected.roles.map((r) => (
                                    <Tag key={r} color="blue" style={{ fontSize: 12 }}>{r}</Tag>
                                ))}
                            </Space>
                        </Col>
                        {selected.accountExpiry && (
                            <Col span={12}>
                                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>账户有效期至</div>
                                <div style={{ fontSize: 14, color: '#ff4d4f' }}>{selected.accountExpiry}</div>
                            </Col>
                        )}
                        {selected.loginRestrict && (
                            <Col span={12}>
                                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>登录限制</div>
                                <div style={{ fontSize: 14 }}>{selected.loginRestrict}</div>
                            </Col>
                        )}
                    </Row>
                )}
            </Modal>

            {/* 交接人确认对话框 */}
            <Modal
                open={handoverModalOpen}
                title="是否指定交接人？"
                onCancel={() => { setHandoverModalOpen(false); setHandoverAction(null); }}
                footer={null}
                width={480}
            >
                <div style={{ marginBottom: 16, fontSize: 14, color: 'rgba(0,0,0,0.65)' }}>
                    该操作将变更用户状态，其名下的任务、待办事项、消息等需要妥善处理。是否为该用户指定交接人？
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={() => { setHandoverModalOpen(false); setHandoverAction(null); }}>取消</Button>
                    <Button type="default" onClick={handleHandoverNo}>否，直接执行</Button>
                    <Button type="primary" onClick={handleHandoverYes}>是，指定交接人</Button>
                </div>
            </Modal>

            {/* 交接人选择对话框 */}
            <Modal
                open={handoverSelectorOpen}
                title="选择人员"
                onCancel={() => { setHandoverSelectorOpen(false); setHandoverSelectedUser(null); setHandoverSearch(''); }}
                onOk={handleHandoverSelectConfirm}
                okButtonProps={{ disabled: !handoverSelectedUser }}
                width={720}
                bodyStyle={{ padding: 0 }}
            >
                <div style={{ display: 'flex', height: 420 }}>
                    {/* 左侧：组织架构 + 人员树 */}
                    <div style={{ flex: 1, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '12px 16px 8px', fontWeight: 500, color: '#1677ff', fontSize: 14 }}>用户列表</div>
                        <div style={{ padding: '0 12px 8px' }}>
                            <Input.Search
                                placeholder="搜索人员或组织..."
                                value={handoverSearch}
                                onChange={(e) => setHandoverSearch(e.target.value)}
                                allowClear
                            />
                        </div>
                        <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 12px' }}>
                            <Tree
                                checkable
                                checkStrictly
                                checkedKeys={handoverSelectedUser ? [handoverSelectedUser] : []}
                                onCheck={(checked) => {
                                    const keys = (checked as { checked: string[] }).checked;
                                    // 只允许选中人员节点（以 u 开头），且仅单人
                                    const userKeys = keys.filter((k) => k.startsWith('u'));
                                    if (userKeys.length > 0) {
                                        setHandoverSelectedUser(userKeys[userKeys.length - 1]);
                                    } else {
                                        setHandoverSelectedUser(null);
                                    }
                                }}
                                expandedKeys={handoverExpandedKeys}
                                onExpand={(keys) => setHandoverExpandedKeys(keys as string[])}
                                treeData={((): DataNode[] => {
                                    const activeUsers = users.filter((u) => u.status === 'active');
                                    const searchLower = handoverSearch.toLowerCase();
                                    // 构建带人员的树：组织节点 + 人员叶子节点
                                    function buildPersonTree(nodes: DataNode[]): DataNode[] {
                                        return nodes.map((node) => {
                                            const orgName = String(node.title);
                                            const childOrgs = node.children ? buildPersonTree(node.children) : [];
                                            const childUsers = activeUsers
                                                .filter((u) => u.mainOrg === orgName)
                                                .filter((u) => !searchLower || u.name.toLowerCase().includes(searchLower) || u.mainOrg.toLowerCase().includes(searchLower))
                                                .map((u) => ({
                                                    key: u.id,
                                                    title: (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                            <Avatar size={20} style={{ fontSize: 10, flexShrink: 0 }}>{u.name[0]}</Avatar>
                                                            <span>{u.name}</span>
                                                            <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>{u.mainPosition}</span>
                                                        </span>
                                                    ),
                                                    isLeaf: true,
                                                } as DataNode));
                                            const allChildren = [...childOrgs, ...childUsers];
                                            // 搜索时过滤：如果自身匹配则保留全部子节点，否则只保留匹配的子节点
                                            const selfMatch = !searchLower || orgName.toLowerCase().includes(searchLower);
                                            if (!selfMatch && allChildren.length === 0) return null as any;
                                            return {
                                                key: node.key,
                                                title: orgName,
                                                children: allChildren,
                                            } as DataNode;
                                        }).filter(Boolean);
                                    }
                                    return buildPersonTree(orgTreeData);
                                })()}
                            />
                        </div>
                    </div>
                    {/* 右侧：已选人员 */}
                    <div style={{ width: 240, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '12px 16px 8px', fontWeight: 500, fontSize: 14 }}>
                            已选择（{handoverSelectedUser ? 1 : 0}）
                        </div>
                        <div style={{ flex: 1, overflow: 'auto', padding: '0 12px' }}>
                            {handoverSelectedUser ? (() => {
                                const u = users.find((x) => x.id === handoverSelectedUser);
                                if (!u) return null;
                                return (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '8px 10px', borderRadius: 6, border: '1px solid #f0f0f0', marginTop: 4,
                                    }}>
                                        <Avatar size={24} style={{ fontSize: 12, flexShrink: 0 }}>{u.name[0]}</Avatar>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                                            <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.mainOrg}</div>
                                        </div>
                                        <Button type="text" size="small" danger icon={<Trash2 size={12} />} onClick={() => setHandoverSelectedUser(null)} />
                                    </div>
                                );
                            })() : (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(0,0,0,0.25)', fontSize: 13 }}>暂未选择</div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
